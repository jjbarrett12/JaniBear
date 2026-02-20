/* eslint-disable @typescript-eslint/no-namespace */
import 'leaflet';

declare module 'leaflet' {
  namespace Draw {
    const Event: {
      CREATED: string;
      EDITED: string;
      DELETED: string;
      DRAWSTART: string;
      DRAWSTOP: string;
      DRAWVERTEX: string;
      EDITSTART: string;
      EDITSTOP: string;
      EDITVERTEX: string;
      EDITMOVE: string;
      EDITRESIZE: string;
      DELETESTART: string;
      DELETESTOP: string;
    };
  }

  namespace DrawEvents {
    interface Created extends LeafletEvent {
      layer: Layer;
      layerType: string;
    }
  }

  namespace Control {
    class Draw extends Control {
      constructor(options?: DrawConstructorOptions);
    }

    interface DrawConstructorOptions {
      position?: string;
      draw?: DrawOptions;
      edit?: EditOptions;
    }

    interface DrawOptions {
      polyline?: DrawPolylineOptions | false;
      polygon?: DrawPolygonOptions | false;
      rectangle?: DrawRectangleOptions | false;
      circle?: DrawCircleOptions | false;
      circlemarker?: DrawCircleMarkerOptions | false;
      marker?: DrawMarkerOptions | false;
    }

    interface DrawPolylineOptions {
      allowIntersection?: boolean;
      [key: string]: unknown;
    }

    interface DrawPolygonOptions {
      allowIntersection?: boolean;
      showArea?: boolean;
      [key: string]: unknown;
    }

    interface DrawRectangleOptions {
      [key: string]: unknown;
    }

    interface DrawCircleOptions {
      [key: string]: unknown;
    }

    interface DrawCircleMarkerOptions {
      [key: string]: unknown;
    }

    interface DrawMarkerOptions {
      [key: string]: unknown;
    }

    interface EditOptions {
      featureGroup: FeatureGroup;
      remove?: boolean;
      edit?: boolean | Record<string, unknown>;
    }
  }
}

declare module 'leaflet-draw' {
  // Side-effect import: extends L namespace
}
