import { ModuleDetailContent } from './module-detail.types';
import { MODULE_CONTENT_PHOTO } from './module-content-photo.data';
import { MODULE_CONTENT_SALES } from './module-content-sales.data';
import { MODULE_CONTENT_COMMUNICATION } from './module-content-communication.data';
import { MODULE_CONTENT_AI } from './module-content-ai.data';
import { MODULE_CONTENT_COMMUNITY } from './module-content-community.data';
import { MODULE_CONTENT_BUSINESS } from './module-content-business.data';

export const MODULE_DETAIL_CONTENTS: Record<string, ModuleDetailContent> = {
  ...MODULE_CONTENT_PHOTO,
  ...MODULE_CONTENT_SALES,
  ...MODULE_CONTENT_COMMUNICATION,
  ...MODULE_CONTENT_AI,
  ...MODULE_CONTENT_COMMUNITY,
  ...MODULE_CONTENT_BUSINESS,
};
