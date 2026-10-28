import { ASTVisitor, FragmentDefinitionNode, GraphQLError, Kind, SelectionSetNode, ValidationContext } from 'graphql';

// the site's deepest query (cars -> seller -> liked) is about 5 levels
export const MAX_QUERY_DEPTH = 10;

/**
 * Rejects queries nested deeper than `max` levels (e.g. members -> followers -> members -> ... built to
 * make the server do a lot of work). Introspection fields (__schema, __type) are not counted.
 */
export const depthLimit =
	(max: number) =>
	(context: ValidationContext): ASTVisitor => {
		const fragments = new Map<string, FragmentDefinitionNode>();
		for (const definition of context.getDocument().definitions)
			if (definition.kind === Kind.FRAGMENT_DEFINITION) fragments.set(definition.name.value, definition);

		const depthOf = (selectionSet: SelectionSetNode | undefined, seen: Set<string>): number => {
			let deepest = 0;
			for (const selection of selectionSet?.selections ?? []) {
				if (selection.kind === Kind.FIELD) {
					if (selection.name.value.startsWith('__')) continue;
					deepest = Math.max(deepest, 1 + depthOf(selection.selectionSet, seen));
				} else if (selection.kind === Kind.INLINE_FRAGMENT) {
					deepest = Math.max(deepest, depthOf(selection.selectionSet, seen));
				} else {
					const name = selection.name.value;
					const fragment = fragments.get(name);
					// a fragment that includes itself is reported by the standard rules
					if (!fragment || seen.has(name)) continue;
					deepest = Math.max(deepest, depthOf(fragment.selectionSet, new Set([...seen, name])));
				}
			}
			return deepest;
		};

		return {
			OperationDefinition(node) {
				const depth = depthOf(node.selectionSet, new Set());
				if (depth > max) context.reportError(new GraphQLError(`Query is too deep (${depth} levels, max ${max})`, { nodes: [node] }));
			},
		};
	};
