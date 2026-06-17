import {useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';

import {useAppLanguage} from '../../i18n/AppLanguageProvider';
import type {SupportedLanguageCode} from '../../i18n/languages';
import type {PlaceSelection} from '../../types';
import type {AppliedPreviewValues} from '../../utils/eventRoomPreviewForm';
import {toggleRoomLanguageCode} from '../../utils/eventRoomLanguages';

type UseRoomCreationFormParams = {
  requiresPlace: boolean;
  selectedPlace: PlaceSelection | undefined;
};

export function useRoomCreationForm({
  requiresPlace,
  selectedPlace,
}: UseRoomCreationFormParams) {
  const {language} = useAppLanguage();
  const {t} = useTranslation('rooms');
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [newRoomCode, setNewRoomCode] = useState('');
  const [languageCodes, setLanguageCodes] = useState<SupportedLanguageCode[]>([
    language,
  ]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [eventUrl, setEventUrl] = useState('');
  const [selectedPlaceForRoom, setSelectedPlaceForRoom] =
    useState<PlaceSelection | null>(null);
  const appliedPreviewValuesRef = useRef<AppliedPreviewValues>({});
  const languageSelectionEditedRef = useRef(false);

  useEffect(() => {
    if (languageSelectionEditedRef.current) {
      return;
    }

    setLanguageCodes([language]);
  }, [language]);

  useEffect(() => {
    if (!requiresPlace) {
      setSelectedPlaceForRoom(null);
      setLocation('');
      delete appliedPreviewValuesRef.current.location;
      return;
    }

    if (!selectedPlace) {
      setSelectedPlaceForRoom(null);
      setLocation('');
      delete appliedPreviewValuesRef.current.location;
      return;
    }

    setSelectedPlaceForRoom(selectedPlace);
    setLocation(
      selectedPlace.name.trim() ||
        selectedPlace.roadAddress?.trim() ||
        selectedPlace.address?.trim() ||
        (selectedPlace.source === 'center' ? t('selectedPlaceFallback') : ''),
    );
    delete appliedPreviewValuesRef.current.location;
  }, [requiresPlace, selectedPlace, t]);

  const handleTitleChange = (nextTitle: string) => {
    setTitle(nextTitle);
    delete appliedPreviewValuesRef.current.title;
  };

  const handleLocationChange = (nextLocation: string) => {
    setLocation(nextLocation);
    setSelectedPlaceForRoom(null);
    delete appliedPreviewValuesRef.current.location;
  };

  const handleDateChange = (nextEventDate: string) => {
    delete appliedPreviewValuesRef.current.eventDate;
    setEventDate(nextEventDate);
  };

  const toggleLanguageCode = (languageCode: SupportedLanguageCode) => {
    languageSelectionEditedRef.current = true;
    setLanguageCodes(currentLanguageCodes =>
      toggleRoomLanguageCode(currentLanguageCodes, languageCode),
    );
  };

  const reset = () => {
    setTitle('');
    setEventDate('');
    setLocation('');
    setNewRoomCode('');
    setEventUrl('');
    languageSelectionEditedRef.current = false;
    setLanguageCodes([language]);
    setSelectedPlaceForRoom(null);
    appliedPreviewValuesRef.current = {};
  };

  return {
    title,
    setTitle,
    eventDate,
    setEventDate,
    location,
    setLocation,
    newRoomCode,
    setNewRoomCode,
    languageCodes,
    toggleLanguageCode,
    showDatePicker,
    setShowDatePicker,
    eventUrl,
    setEventUrl,
    selectedPlaceForRoom,
    setSelectedPlaceForRoom,
    appliedPreviewValuesRef,
    handleTitleChange,
    handleLocationChange,
    handleDateChange,
    reset,
  };
}
