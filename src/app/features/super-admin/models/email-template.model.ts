export interface GlobalEmailTemplateListItem {
  id: number;
  name: string;
  display_name: string;
  subject: string;
  category: string;
  is_active: boolean;
  is_system: boolean;
  updated_at: string;
}

export interface GlobalEmailTemplateDetail extends GlobalEmailTemplateListItem {
  body: string;
  available_variables: string[];
}

// Reuse partner-ből
export { EmailVariableGroup, EmailTemplatePreview } from '../../partner/models/email-template.model';
