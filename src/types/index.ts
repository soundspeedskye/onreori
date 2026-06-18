import type { EventCategoryId } from '../constants/eventCategories';
import type { SupportedLanguageCode } from '../i18n/languages';

export type { EventCategoryId };
export type { SupportedLanguageCode };

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

export type ChecklistSaveState =
  | 'draft'
  | 'localOnly'
  | 'deviceSaved'
  | 'synced'
  | 'syncFailed';

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

export type RemoteChecklistSummary = {
  remoteId: string;
  localId: string;
  categoryId: string;
  templateId: string;
  title: string;
  selectedConditions: ConditionId[];
  createdAt: string;
  updatedAt: string;
};

export type EventCategory = {
  id: EventCategoryId;
  title: string;
  icon: string;
  description?: string;
  templateId: string;
  roomLabel: string;
};

export type PlaceSelection = {
  provider: 'kakao';
  name: string;
  address?: string;
  roadAddress?: string;
  latitude: number;
  longitude: number;
  source: 'center' | 'pin' | 'search' | 'address';
};

export type CafeRouteStop = PlaceSelection & {
  id: string;
  order: number;
  benefitNote?: string;
  memo?: string;
  createdAt: string;
};

export type CafeRoute = {
  id: string;
  ownerId?: string;
  categoryId: string;
  title: string;
  subjectName?: string;
  stops: CafeRouteStop[];
  createdAt: string;
  updatedAt: string;
};

export type EventUrlPreview = {
  url: string;
  title?: string;
  description?: string;
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

export type RoomStatus = 'active' | 'closed' | 'soft_deleted';

export type EventRoomLanguageFilter = SupportedLanguageCode | 'all';

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
  primaryLanguage: SupportedLanguageCode;
  languageCodes: SupportedLanguageCode[];
  status: RoomStatus;
  eventTimezone: string;
  activeFromAt: string;
  activeUntilAt: string;
  closedAt?: string;
  deletedAt?: string;
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
  CafeRoutes: {
    categoryId: string;
    routeId?: string;
    selectedPlace?: PlaceSelection;
  };
  Auth: { redirect?: AuthRedirect } | undefined;
  EventRooms: { categoryId: string; selectedPlace?: PlaceSelection };
  MapPicker:
    | { categoryId: string; returnTo: 'EventRooms' }
    | { categoryId: string; returnTo: 'CafeRoutes'; routeId?: string };
  RoomChat: {
    roomId: string;
    title: string;
    categoryId?: string;
    languageCodes?: SupportedLanguageCode[];
  };
  MyPage: undefined;
  ShareCard: { checklistId: string };
};
