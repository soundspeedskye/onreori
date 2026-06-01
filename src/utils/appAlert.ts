import {Alert, type AlertButton} from 'react-native';

export {ALERT_MESSAGES} from '../constants/alertMessages';

type ShowAlertParams = {
  title: string;
  message?: string;
  actions?: AlertButton[];
};

type ShowErrorParams = {
  title: string;
  fallbackMessage: string;
  actions?: AlertButton[];
};

export function getErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  return error instanceof Error ? error.message : fallbackMessage;
}

export function showAlert({title, message, actions}: ShowAlertParams): void {
  Alert.alert(title, message, actions);
}

export function showError(
  error: unknown,
  {title, fallbackMessage, actions}: ShowErrorParams,
): void {
  showAlert({
    title,
    message: getErrorMessage(error, fallbackMessage),
    actions,
  });
}
