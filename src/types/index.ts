export type ConditionId = string;

export type TemplateCondition = {
  id: ConditionId;
  label: string;
  description: string;
};

export type TemplateItem = {
  id: string;
  name: string;
  section: string;
  essential: boolean;
  tip: string;
  when: ConditionId[];
};

export type Template = {
  id: string;
  title: string;
  category: string;
  icon: string;
  theme: string;
  description: string;
  items: TemplateItem[];
};

export type TemplatesDocument = {
  version: number;
  locale: string;
  conditions: TemplateCondition[];
  templates: Template[];
};

export type StickerSlotKey =
  | 'topLeft'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomRight';

export type ChecklistItem = TemplateItem & {
  checked: boolean;
  custom: boolean;
  sourceItemId?: string;
};

export type ChecklistSaveState = 'draft' | 'localOnly' | 'synced';

export type Checklist = {
  id: string;
  remoteId?: string;
  ownerId?: string;
  templateId: string;
  categoryId: string;
  title: string;
  icon: string;
  theme: string;
  selectedConditions: ConditionId[];
  createdAt: string;
  updatedAt: string;
  saveState: ChecklistSaveState;
  items: ChecklistItem[];
  stickers: Record<StickerSlotKey, string | null>;
};

export type EventCategory = {
  id: string;
  title: string;
  shortTitle: string;
  icon: string;
  description: string;
  templateId: string;
  roomLabel: string;
};

export type AuthRedirect =
  | {
      type: 'eventRooms';
      categoryId: string;
    }
  | {
      type: 'accountSave';
      checklistId: string;
    }
  | {
      type: 'myPage';
    };

export type AuthUser = {
  id: string;
  email: string;
  nickname: string;
};

export type EventRoom = {
  id: string;
  categoryId: string;
  title: string;
  eventDate: string;
  location: string;
  memberCount: number;
  createdBy: string;
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  roomId: string;
  userId: string;
  nickname: string;
  type: 'text' | 'image';
  body: string;
  mediaUrl?: string;
  createdAt: string;
};

export type RootStackParamList = {
  Landing: undefined;
  CategoryHome: undefined;
  CategoryDetail: {categoryId: string};
  Templates: {categoryId?: string} | undefined;
  Conditions: {templateId: string};
  Checklist: {checklistId: string};
  Auth: {redirect?: AuthRedirect} | undefined;
  EventRooms: {categoryId: string};
  RoomChat: {roomId: string; title: string};
  MyPage: undefined;
  ShareCard: {checklistId: string};
};
