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
};

export type EventCategory = {
  id: string;
  title: string;
  icon: string;
  description?: string;
  templateId: string;
  roomLabel: string;
};

export type EventCategoryId = 'EVENT_DAY' | 'POPUP' | 'CAFE_EVENT';

export type PlaceSelection = {
  provider: 'naver';
  name: string;
  address?: string;
  roadAddress?: string;
  latitude: number;
  longitude: number;
  source: 'pin' | 'search';
};

export type EventUrlPreview = {
  url: string;
  title?: string;
  dateCandidates: string[];
  locationCandidates: string[];
  confidence: 'high' | 'medium' | 'low';
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
  eventUrl?: string;
  locationName?: string;
  address?: string;
  roadAddress?: string;
  latitude?: number;
  longitude?: number;
  subjectName?: string;
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
  hashtags?: string[];
  createdAt: string;
};

export type RootStackParamList = {
  Landing: undefined;
  CategoryHome: undefined;
  CategoryDetail: { categoryId: string };
  Conditions: { templateId: string };
  Checklist: { checklistId: string };
  Auth: { redirect?: AuthRedirect } | undefined;
  EventRooms: { categoryId: string; selectedPlace?: PlaceSelection };
  MapPicker: { categoryId: string; returnTo: 'EventRooms' };
  RoomChat: { roomId: string; title: string; categoryId?: string };
  MyPage: undefined;
  ShareCard: { checklistId: string };
};
