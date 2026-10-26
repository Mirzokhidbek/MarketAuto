import { Schema } from 'mongoose';

// editable site settings (contacts, social links); one document per key
const SettingSchema = new Schema(
	{
		key: { type: String, required: true, unique: true },
		value: { type: String, default: '' },
	},
	{ timestamps: true, collection: 'settings' },
);

export default SettingSchema;
