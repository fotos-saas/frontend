export interface EmailTemplateListItem {
  id: number;
  name: string;
  display_name: string;
  subject: string;
  category: 'auth' | 'session' | 'order' | 'tablo' | 'general';
  is_customized: boolean;
  is_system: boolean;
  updated_at: string;
}

export interface EmailTemplateDetail extends EmailTemplateListItem {
  body: string;
  global_subject: string;
  global_body: string;
}

export interface EmailVariableGroup {
  group: string;
  label: string;
  variables: { key: string; description: string }[];
}

export interface EmailTemplatePreview {
  subject: string;
  body_html: string;
}
