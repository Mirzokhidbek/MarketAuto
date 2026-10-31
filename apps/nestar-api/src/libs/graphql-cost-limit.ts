import { ASTVisitor, FragmentDefinitionNode, GraphQLError, Kind, SelectionSetNode, ValidationContext } from 'graphql';

// the site's biggest query (GetFavorites) selects 65 fields; the most root fields in one query is 3 (admin feed)
export const MAX_QUERY_FIELDS = 400;
export const MAX_ROOT_FIELDS = 15;

/**
 * The depth limit stops deep queries; this stops wide ones: one request that selects thousands of fields, or
 * repeats one operation under many aliases ({ a1: getProperty(...) a2: getProperty(...) ... }) to multiply the
 * work of a single HTTP request past every per-request limit. Fragments are counted where they are used, once
 * per use (memoized, so a fragment that spreads others many times cannot blow up the counting itself).
 */
export const costLimit =
	(maxFields = MAX_QUERY_FIELDS, maxRootFields = MAX_ROOT_FIELDS) =>
	(context: ValidationContext): ASTVisitor => {
		const fragments = new Map<string, FragmentDefinitionNode>();
		for (const definition of context.getDocument().definitions)
			if (definition.kind === Kind.FRAGMENT_DEFINITION) fragments.set(definition.name.value, definition);
		const fragmentCost = new Map<string, number>();

		const fieldsIn = (selectionSet: SelectionSetNode | undefined, seen: Set<string>): number => {
			let total = 0;
			for (const selection of selectionSet?.selections ?? []) {
				if (selection.kind === Kind.FIELD) {
					if (selection.name.value.startsWith('__')) continue;
					total += 1 + fieldsIn(selection.selectionSet, seen);
				} else if (selection.kind === Kind.INLINE_FRAGMENT) {
					total += fieldsIn(selection.selectionSet, seen);
				} else {
					const name = selection.name.value;
					const fragment = fragments.get(name);
					// unknown or self-including fragments are reported by the standard rules
					if (!fragment || seen.has(name)) continue;
					if (!fragmentCost.has(name))
						fragmentCost.set(name, fieldsIn(fragment.selectionSet, new Set([...seen, name])));
					total += fragmentCost.get(name)!;
				}
				// stop counting early: the answer is "too big" either way
				if (total > maxFields) return total;
			}
			return total;
		};

		const rootFields = (selectionSet: SelectionSetNode, seen: Set<string>): number => {
			let count = 0;
			for (const selection of selectionSet.selections) {
				if (selection.kind === Kind.FIELD) count += selection.name.value.startsWith('__') ? 0 : 1;
				else if (selection.kind === Kind.INLINE_FRAGMENT) count += rootFields(selection.selectionSet, seen);
				else {
					const fragment = fragments.get(selection.name.value);
					if (fragment && !seen.has(selection.name.value))
						count += rootFields(fragment.selectionSet, new Set([...seen, selection.name.value]));
				}
			}
			return count;
		};

		return {
			OperationDefinition(node) {
				const roots = rootFields(node.selectionSet, new Set());
				if (roots > maxRootFields) {
					context.reportError(
						new GraphQLError(`Too many operations in one request (${roots}, max ${maxRootFields})`, { nodes: [node] }),
					);
					return;
				}
				const fields = fieldsIn(node.selectionSet, new Set());
				if (fields > maxFields)
					context.reportError(
						new GraphQLError(`Query selects too many fields (more than ${maxFields})`, { nodes: [node] }),
					);
			},
		};
	};
