import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {saveChecklistToAccount} from '../../services/checklistAccount';
import {
  consumePendingAccountSaveChecklistId,
  getChecklistById,
  saveChecklistSynced,
} from '../../storage/checklists';
import type {AuthRedirect, AuthUser, RootStackParamList} from '../../types';
import {ALERT_MESSAGES, showAlert} from '../../utils/appAlert';

type AuthNavigation = NativeStackNavigationProp<RootStackParamList, 'Auth'>;

type UseAuthRedirectParams = {
  navigation: AuthNavigation;
  redirect: AuthRedirect | undefined;
};

export function useAuthRedirect({
  navigation,
  redirect,
}: UseAuthRedirectParams) {
  const completeRedirect = async (nextUser: AuthUser) => {
    if (!redirect) {
      navigation.replace('CategoryHome');
      return;
    }

    if (redirect.type === 'eventRooms') {
      navigation.replace('EventRooms', {categoryId: redirect.categoryId});
      return;
    }

    if (redirect.type === 'myPage') {
      navigation.replace('MyPage');
      return;
    }

    const pendingChecklistId =
      (await consumePendingAccountSaveChecklistId()) ?? redirect.checklistId;
    const checklist = await getChecklistById(pendingChecklistId);

    if (!checklist) {
      showAlert({title: ALERT_MESSAGES.notFound});
      navigation.replace('CategoryHome');
      return;
    }

    const remoteReference = await saveChecklistToAccount(checklist, nextUser);
    await saveChecklistSynced(checklist, remoteReference);
    navigation.replace('Checklist', {checklistId: checklist.id});
  };

  return {completeRedirect};
}
