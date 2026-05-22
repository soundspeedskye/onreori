import React from 'react';
import {Alert} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

import {MapPickerScreen} from '../src/screens/MapPickerScreen';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({children}: {children: React.ReactNode}) => children,
}));

jest.mock('@mj-studio/react-native-naver-map', () => ({
  NaverMapView: ({children, ...props}: {children?: React.ReactNode}) =>
    require('react').createElement('NaverMapView', props, children),
  NaverMapMarkerOverlay: (props: Record<string, unknown>) =>
    require('react').createElement('NaverMapMarkerOverlay', props),
}));

const NaverMapViewTestType = 'NaverMapView' as unknown as React.ElementType;

function renderScreen() {
  const navigation = {
    navigate: jest.fn(),
  };

  const route = {
    params: {
      categoryId: 'EVENT_DAY',
      returnTo: 'EventRooms',
    },
  };

  let renderer: ReactTestRenderer.ReactTestRenderer;

  ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <MapPickerScreen navigation={navigation as never} route={route as never} />,
    );
  });

  return {navigation, root: renderer!.root};
}

test('requires a map selection before confirming', () => {
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation();
  const {navigation, root} = renderScreen();

  ReactTestRenderer.act(() => {
    root.findByProps({title: '장소 등록'}).props.onPress();
  });

  expect(alertSpy).toHaveBeenCalledWith('지도에서 장소를 선택하세요.');
  expect(navigation.navigate).not.toHaveBeenCalled();

  alertSpy.mockRestore();
});

test('returns selected pin coordinates to the room form', () => {
  const {navigation, root} = renderScreen();

  ReactTestRenderer.act(() => {
    root.findByType(NaverMapViewTestType).props.onTapMap({
      latitude: 37.57,
      longitude: 126.98,
      x: 10,
      y: 20,
    });
  });

  expect(
    root.findByProps({latitude: 37.57, longitude: 126.98}),
  ).toBeTruthy();
  expect(root.findByProps({children: '37.57000, 126.98000'})).toBeTruthy();

  ReactTestRenderer.act(() => {
    root.findByProps({title: '장소 등록'}).props.onPress();
  });

  expect(navigation.navigate).toHaveBeenCalledWith('EventRooms', {
    categoryId: 'EVENT_DAY',
    selectedPlace: {
      provider: 'naver',
      name: '선택한 장소',
      latitude: 37.57,
      longitude: 126.98,
      source: 'pin',
    },
  });
});
