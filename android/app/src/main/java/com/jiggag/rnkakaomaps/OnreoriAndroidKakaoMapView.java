package com.jiggag.rnkakaomaps;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.drawable.Drawable;
import android.view.Choreographer;
import android.util.Log;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.kakao.vectormap.KakaoMap;
import com.kakao.vectormap.KakaoMapReadyCallback;
import com.kakao.vectormap.LatLng;
import com.kakao.vectormap.MapLifeCycleCallback;
import com.kakao.vectormap.MapView;
import com.kakao.vectormap.camera.CameraPosition;
import com.kakao.vectormap.camera.CameraUpdateFactory;
import com.kakao.vectormap.label.LabelLayer;
import com.kakao.vectormap.label.LabelOptions;
import com.kakao.vectormap.label.LabelStyle;
import com.kakao.vectormap.label.LabelStyles;
import com.kakao.vectormap.label.LabelTextBuilder;

import java.util.ArrayList;
import java.util.HashMap;

public class OnreoriAndroidKakaoMapView extends FrameLayout implements LifecycleEventListener {
    private static final String LOG_TAG = "OnreoriKakaoMapView";
    private static final double INIT_LAT = 37.537229;
    private static final double INIT_LNG = 127.005515;
    private static final int INIT_ZOOM_LEVEL = 15;
    private static final int FIT_MARKER_PADDING_DP = 24;
    private static final String PARAM_LAT = "lat";
    private static final String PARAM_LNG = "lng";
    private static final String PARAM_MARKER_NAME = "markerName";

    private final ThemedReactContext reactContext;
    private final MapView mapView;
    @Nullable
    private Choreographer.FrameCallback layoutCallback;

    @Nullable
    private KakaoMap kakaoMap;
    @Nullable
    private ArrayList markerList;
    private boolean mapStarted = false;
    private boolean isDisposed = false;
    private boolean layoutCallbackActive = false;
    private boolean fitToMarkers = false;
    private double paramLat = INIT_LAT;
    private double paramLng = INIT_LNG;
    @Nullable
    private String markerImageName;

    public OnreoriAndroidKakaoMapView(ThemedReactContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.mapView = new MapView(reactContext);

        addView(
                mapView,
                new FrameLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                )
        );
        reactContext.addLifecycleEventListener(this);
    }

    public void setMarkerList(@Nullable ReadableArray markerList) {
        this.markerList = markerList != null ? markerList.toArrayList() : null;
        updateMarkers();
        applyCurrentCamera();
    }

    public void setCenterPoint(@Nullable ReadableMap centerPoint) {
        boolean centerChanged = false;

        if (centerPoint != null) {
            if (centerPoint.hasKey(PARAM_LAT)) {
                double nextLat = centerPoint.getDouble(PARAM_LAT);
                if (Double.compare(paramLat, nextLat) != 0) {
                    paramLat = nextLat;
                    centerChanged = true;
                }
            }
            if (centerPoint.hasKey(PARAM_LNG)) {
                double nextLng = centerPoint.getDouble(PARAM_LNG);
                if (Double.compare(paramLng, nextLng) != 0) {
                    paramLng = nextLng;
                    centerChanged = true;
                }
            }
        }

        if (centerChanged) {
            applyCurrentCamera();
        }
    }

    public void setFitToMarkers(boolean fitToMarkers) {
        if (this.fitToMarkers == fitToMarkers) {
            return;
        }

        this.fitToMarkers = fitToMarkers;
        applyCurrentCamera();
    }

    public void setMarkerImageName(@Nullable String markerImageName) {
        this.markerImageName = markerImageName;
        updateMarkers();
    }

    public void setMarkerImageUrl(@Nullable String markerImageUrl) {
        // URL marker images are not used by the current map picker UI.
    }

    public void dispose() {
        if (isDisposed) {
            return;
        }

        isDisposed = true;
        stopLayout();
        reactContext.removeLifecycleEventListener(this);

        if (mapStarted) {
            mapView.pause();
            mapView.finish();
            mapStarted = false;
        }
    }

    @Override
    protected void onAttachedToWindow() {
        super.onAttachedToWindow();
        startLayout();
        startMapIfNeeded();
    }

    @Override
    protected void onDetachedFromWindow() {
        stopLayout();
        if (mapStarted && !isDisposed) {
            mapView.pause();
        }
        super.onDetachedFromWindow();
    }

    @Override
    protected void onSizeChanged(int width, int height, int oldWidth, int oldHeight) {
        super.onSizeChanged(width, height, oldWidth, oldHeight);
        manuallyLayoutMapView();
    }

    @Override
    public void onHostResume() {
        if (mapStarted && !isDisposed) {
            mapView.resume();
        }
    }

    @Override
    public void onHostPause() {
        if (mapStarted && !isDisposed) {
            mapView.pause();
        }
    }

    @Override
    public void onHostDestroy() {
        dispose();
    }

    private void startMapIfNeeded() {
        if (mapStarted || isDisposed) {
            return;
        }

        mapStarted = true;
        mapView.start(createLifeCycleCallback(), createReadyCallback());
    }

    private void startLayout() {
        stopLayout();
        layoutCallbackActive = true;
        layoutCallback = new Choreographer.FrameCallback() {
            @Override
            public void doFrame(long frameTimeNanos) {
                if (!layoutCallbackActive) {
                    return;
                }

                manuallyLayoutMapView();
                getViewTreeObserver().dispatchOnGlobalLayout();
                Choreographer.getInstance().postFrameCallback(this);
            }
        };
        Choreographer.getInstance().postFrameCallback(layoutCallback);
    }

    private void stopLayout() {
        layoutCallbackActive = false;
        if (layoutCallback != null) {
            Choreographer.getInstance().removeFrameCallback(layoutCallback);
        }
        layoutCallback = null;
    }

    private void manuallyLayoutMapView() {
        if (getWidth() <= 0 || getHeight() <= 0) {
            return;
        }

        mapView.measure(
                MeasureSpec.makeMeasureSpec(getWidth(), MeasureSpec.EXACTLY),
                MeasureSpec.makeMeasureSpec(getHeight(), MeasureSpec.EXACTLY)
        );
        mapView.layout(0, 0, getWidth(), getHeight());
    }

    private MapLifeCycleCallback createLifeCycleCallback() {
        return new MapLifeCycleCallback() {
            @Override
            public void onMapDestroy() {
                Log.i(LOG_TAG, "MapView destroyed");
            }

            @Override
            public void onMapError(Exception error) {
                Log.e(LOG_TAG, "MapView error", error);
                emitMapError("Kakao map lifecycle error.", error.getMessage());
            }
        };
    }

    private KakaoMapReadyCallback createReadyCallback() {
        return new KakaoMapReadyCallback() {
            @Override
            public void onMapReady(@NonNull KakaoMap readyMap) {
                kakaoMap = readyMap;
                readyMap.setOnCameraMoveEndListener(
                        (map, cameraPosition, gestureType) -> emitCameraPosition(cameraPosition)
                );
                updateMarkers();
                applyCurrentCamera();
                emitCameraPosition(readyMap.getCameraPosition());
            }

            @NonNull
            @Override
            public LatLng getPosition() {
                return LatLng.from(paramLat, paramLng);
            }

            @NonNull
            @Override
            public int getZoomLevel() {
                return INIT_ZOOM_LEVEL;
            }
        };
    }

    private void moveToCurrentCenter() {
        KakaoMap map = kakaoMap;
        if (map == null) {
            return;
        }

        map.moveCamera(CameraUpdateFactory.newCenterPosition(LatLng.from(paramLat, paramLng)));
    }

    private void applyCurrentCamera() {
        if (fitToMarkers && moveToMarkerBounds()) {
            return;
        }

        moveToCurrentCenter();
    }

    private boolean moveToMarkerBounds() {
        KakaoMap map = kakaoMap;
        if (map == null) {
            return false;
        }

        ArrayList<LatLng> points = getMarkerPositions();
        if (points.size() < 2 || !hasCoordinateSpan(points)) {
            return false;
        }

        LatLng[] pointArray = points.toArray(new LatLng[0]);
        map.moveCamera(CameraUpdateFactory.fitMapPoints(pointArray, getFitMarkerPaddingPx()));
        return true;
    }

    private ArrayList<LatLng> getMarkerPositions() {
        ArrayList<LatLng> points = new ArrayList<>();
        if (markerList == null || markerList.isEmpty()) {
            return points;
        }

        for (int i = 0; i < markerList.size(); i++) {
            Object marker = markerList.get(i);
            if (!(marker instanceof HashMap)) {
                continue;
            }

            HashMap<?, ?> markerMap = (HashMap<?, ?>) marker;
            Double lat = getDouble(markerMap.get(PARAM_LAT));
            Double lng = getDouble(markerMap.get(PARAM_LNG));

            if (lat == null || lng == null) {
                continue;
            }

            points.add(LatLng.from(lat, lng));
        }

        return points;
    }

    private boolean hasCoordinateSpan(ArrayList<LatLng> points) {
        LatLng first = points.get(0);
        for (int i = 1; i < points.size(); i++) {
            LatLng point = points.get(i);
            if (
                    Double.compare(first.getLatitude(), point.getLatitude()) != 0 ||
                    Double.compare(first.getLongitude(), point.getLongitude()) != 0
            ) {
                return true;
            }
        }

        return false;
    }

    private int getFitMarkerPaddingPx() {
        float density = getResources().getDisplayMetrics().density;
        return Math.round(FIT_MARKER_PADDING_DP * density);
    }

    private void updateMarkers() {
        KakaoMap map = kakaoMap;
        if (map == null) {
            return;
        }

        LabelLayer layer = map.getLabelManager().getLayer();
        layer.removeAll();

        if (markerList == null || markerList.isEmpty()) {
            return;
        }

        for (int i = 0; i < markerList.size(); i++) {
            Object marker = markerList.get(i);
            if (!(marker instanceof HashMap)) {
                continue;
            }

            HashMap<?, ?> markerMap = (HashMap<?, ?>) marker;
            Double lat = getDouble(markerMap.get(PARAM_LAT));
            Double lng = getDouble(markerMap.get(PARAM_LNG));

            if (lat == null || lng == null) {
                continue;
            }

            String markerName = getString(markerMap.get(PARAM_MARKER_NAME));
            LabelOptions options = LabelOptions.from(
                    "onreori-marker-" + i,
                    LatLng.from(lat, lng)
            ).setStyles(createMarkerStyles(map));

            if (markerName != null && !markerName.isEmpty()) {
                options.setTexts(new LabelTextBuilder().setTexts(markerName));
            }

            layer.addLabel(options);
        }
    }

    private LabelStyles createMarkerStyles(KakaoMap map) {
        int markerImageResourceId = markerImageName != null
                ? getResources().getIdentifier(markerImageName, "drawable", reactContext.getPackageName())
                : 0;

        if (markerImageResourceId > 0) {
            Bitmap markerBitmap = createMarkerBitmap(markerImageResourceId);
            LabelStyle markerStyle = markerBitmap != null
                    ? LabelStyle.from(markerBitmap)
                    : LabelStyle.from(reactContext, markerImageResourceId);
            return map.getLabelManager().addLabelStyles(
                    LabelStyles.from(
                            markerStyle
                                    .setAnchorPoint(0.5f, 1.0f)
                                    .setApplyDpScale(false)
                                    .setTextStyles(28, Color.BLACK)
                    )
            );
        }

        return map.getLabelManager().addLabelStyles(
                LabelStyles.from(LabelStyle.from().setTextStyles(28, Color.BLACK))
        );
    }

    @Nullable
    private Bitmap createMarkerBitmap(int markerImageResourceId) {
        Drawable drawable = ContextCompat.getDrawable(reactContext, markerImageResourceId);

        if (drawable == null) {
            return null;
        }

        int width = drawable.getIntrinsicWidth();
        int height = drawable.getIntrinsicHeight();

        if (width <= 0 || height <= 0) {
            float density = getResources().getDisplayMetrics().density;
            width = Math.round(44 * density);
            height = Math.round(54 * density);
        }

        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        drawable.setBounds(0, 0, canvas.getWidth(), canvas.getHeight());
        drawable.draw(canvas);

        return bitmap;
    }

    private void emitCameraPosition(CameraPosition cameraPosition) {
        LatLng position = cameraPosition.getPosition();
        int zoomLevel = kakaoMap != null ? kakaoMap.getZoomLevel() : INIT_ZOOM_LEVEL;
        EventDispatcher eventDispatcher = UIManagerHelper.getEventDispatcherForReactTag(
                reactContext,
                getId()
        );

        if (eventDispatcher == null) {
            return;
        }

        eventDispatcher.dispatchEvent(
                new OnreoriKakaoMapChangeEvent(
                        UIManagerHelper.getSurfaceId(this),
                        getId(),
                        position.getLatitude(),
                        position.getLongitude(),
                        zoomLevel
                )
        );
    }

    private void emitMapError(@NonNull String message, @Nullable String reason) {
        EventDispatcher eventDispatcher = UIManagerHelper.getEventDispatcherForReactTag(
                reactContext,
                getId()
        );

        if (eventDispatcher == null) {
            return;
        }

        eventDispatcher.dispatchEvent(
                new OnreoriKakaoMapChangeEvent(
                        UIManagerHelper.getSurfaceId(this),
                        getId(),
                        "error",
                        message,
                        reason
                )
        );
    }

    @Nullable
    private static Double getDouble(@Nullable Object value) {
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }

        return null;
    }

    @Nullable
    private static String getString(@Nullable Object value) {
        return value instanceof String ? (String) value : null;
    }
}
