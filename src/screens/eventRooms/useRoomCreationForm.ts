import {useEffect, useRef, useState} from 'react';

import type {PlaceSelection} from '../../types';
import type {AppliedPreviewValues} from '../../utils/eventRoomPreviewForm';

type UseRoomCreationFormParams = {
  requiresPlace: boolean;
  selectedPlace: PlaceSelection | undefined;
};

export function useRoomCreationForm({
  requiresPlace,
  selectedPlace,
}: UseRoomCreationFormParams) {
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [newRoomCode, setNewRoomCode] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [eventUrl, setEventUrl] = useState('');
  const [selectedPlaceForRoom, setSelectedPlaceForRoom] =
    useState<PlaceSelection | null>(null);
  const appliedPreviewValuesRef = useRef<AppliedPreviewValues>({});

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
        (selectedPlace.source === 'center' ? '선택한 장소' : ''),
    );
    delete appliedPreviewValuesRef.current.location;
  }, [requiresPlace, selectedPlace]);

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

  const reset = () => {
    setTitle('');
    setEventDate('');
    setLocation('');
    setNewRoomCode('');
    setEventUrl('');
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
