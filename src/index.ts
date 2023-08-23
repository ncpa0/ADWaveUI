import "gtk-css-web/css";
import "./styles.css";

export * from "./components/input/input";
export * from "./components/slider/slider";
export * from "./components/switch/switch";

type EventHandlerFunction<E extends Event = Event> = (
  event: E,
) => void;

declare global {
  namespace JSX {}

  namespace JSXTE {
    interface BaseHTMLTagProps {
      onpointerover?: string;
      onpointerenter?: string;
      onpointerdown?: string;
      onpointermove?: string;
      onpointerup?: string;
      onpointercancel?: string;
      onpointerout?: string;
      onpointerleave?: string;
      ongotpointercapture?: string;
      onlostpointercapture?: string;
    }
    interface AttributeAcceptedTypes {
      onclick: EventHandlerFunction;
      oninput: EventHandlerFunction;
      onsubmit: EventHandlerFunction;
      onkeydown: EventHandlerFunction;
      onkeyup: EventHandlerFunction;
      onkeypress: EventHandlerFunction;
      onfocus: EventHandlerFunction;
      onblur: EventHandlerFunction;
      onmouseenter: EventHandlerFunction<MouseEvent>;
      onmouseleave: EventHandlerFunction<MouseEvent>;
      onmousedown: EventHandlerFunction<MouseEvent>;
      onmouseup: EventHandlerFunction<MouseEvent>;
      onmousemove: EventHandlerFunction<MouseEvent>;
      onmouseover: EventHandlerFunction<MouseEvent>;
      onmouseout: EventHandlerFunction<MouseEvent>;
      oncontextmenu: EventHandlerFunction;
      onwheel: EventHandlerFunction;
      ondrag: EventHandlerFunction<MouseEvent>;
      ondragstart: EventHandlerFunction<MouseEvent>;
      ondragend: EventHandlerFunction<MouseEvent>;
      ondragenter: EventHandlerFunction<MouseEvent>;
      ondragleave: EventHandlerFunction<MouseEvent>;
      ondragover: EventHandlerFunction<MouseEvent>;
      ondrop: EventHandlerFunction;
      onscroll: EventHandlerFunction;
      onresize: EventHandlerFunction;
      onload: EventHandlerFunction;
      onunload: EventHandlerFunction;
      onerror: EventHandlerFunction;
      onabort: EventHandlerFunction;
      onhashchange: EventHandlerFunction;
      onpopstate: EventHandlerFunction;
      onpageshow: EventHandlerFunction;
      onpagehide: EventHandlerFunction;
      onbeforeunload: EventHandlerFunction;
      onoffline: EventHandlerFunction;
      ononline: EventHandlerFunction;
      onmessage: EventHandlerFunction;
      onmessageerror: EventHandlerFunction;
      onshow: EventHandlerFunction;
      ontoggle: EventHandlerFunction;
      oninvalid: EventHandlerFunction;
      onreset: EventHandlerFunction;
      onsearch: EventHandlerFunction;
      onselect: EventHandlerFunction;
      onselectstart: EventHandlerFunction;
      onselectionchange: EventHandlerFunction;
      oncopy: EventHandlerFunction;
      oncut: EventHandlerFunction;
      onpaste: EventHandlerFunction;
      onbeforecopy: EventHandlerFunction;
      onbeforecut: EventHandlerFunction;
      onbeforepaste: EventHandlerFunction;
      onchange: EventHandlerFunction;

      onpointerover: EventHandlerFunction<PointerEvent>;
      onpointerenter: EventHandlerFunction<PointerEvent>;
      onpointerdown: EventHandlerFunction<PointerEvent>;
      onpointermove: EventHandlerFunction<PointerEvent>;
      onpointerup: EventHandlerFunction<PointerEvent>;
      onpointercancel: EventHandlerFunction<PointerEvent>;
      onpointerout: EventHandlerFunction<PointerEvent>;
      onpointerleave: EventHandlerFunction<PointerEvent>;
      ongotpointercapture: EventHandlerFunction<PointerEvent>;
      onlostpointercapture: EventHandlerFunction<PointerEvent>;
    }
  }
}
