import {i18n} from '../i18n';

export const ALERT_MESSAGES = {
  get failed() {
    return i18n.t('alerts.failed', {ns: 'common'});
  },
  get createFailed() {
    return i18n.t('alerts.createFailed', {ns: 'common'});
  },
  get loadFailed() {
    return i18n.t('alerts.loadFailed', {ns: 'common'});
  },
  get partialLoad() {
    return i18n.t('alerts.partialLoad', {ns: 'common'});
  },
  get saveFailed() {
    return i18n.t('alerts.saveFailed', {ns: 'common'});
  },
  get syncFailed() {
    return i18n.t('alerts.syncFailed', {ns: 'common'});
  },
  get sendFailed() {
    return i18n.t('alerts.sendFailed', {ns: 'common'});
  },
  get notFound() {
    return i18n.t('alerts.notFound', {ns: 'common'});
  },
  get openFailed() {
    return i18n.t('alerts.openFailed', {ns: 'common'});
  },
  get requiredInput() {
    return i18n.t('alerts.requiredInput', {ns: 'common'});
  },
  get requiredSelection() {
    return i18n.t('alerts.requiredSelection', {ns: 'common'});
  },
  get checkInput() {
    return i18n.t('alerts.checkInput', {ns: 'common'});
  },
  get unavailable() {
    return i18n.t('alerts.unavailable', {ns: 'common'});
  },
  get retry() {
    return i18n.t('alerts.retry', {ns: 'common'});
  },
  get supabaseRequired() {
    return i18n.t('alerts.supabaseRequired', {ns: 'common'});
  },
} as const;
