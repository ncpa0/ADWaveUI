import {
  DefaultTemplateArrayCache,
  renderToStringTemplateTag,
} from "jsxte";
import { html } from "lit";

const stringTemplateArrayCacheMap = new WeakMap<
  Object,
  DefaultTemplateArrayCache
>();

export function render<
  T extends (this: Object, ...args: any[]) => JSX.Element,
>(
  proto: Object,
  key: string | symbol,
  descriptor: TypedPropertyDescriptor<T>,
) {
  const original = descriptor.value!;

  descriptor.value = function (this: Object, ...args: any[]) {
    const result = original.apply(this, args);
    let cache = stringTemplateArrayCacheMap.get(this);

    if (!cache) {
      cache = new DefaultTemplateArrayCache();
      stringTemplateArrayCacheMap.set(this, cache);
    }

    return renderToStringTemplateTag(html, result, {
      ...RENDER_OPTIONS,
      cache,
    });
  } as any;

  return descriptor;
}

const ATTRIBUTE_MAP = {
  onclick: "@click",
  oninput: "@input",
  onsubmit: "@submit",
  onkeydown: "@keydown",
  onkeyup: "@keyup",
  onkeypress: "@keypress",
  onfocus: "@focus",
  onblur: "@blur",
  onmouseenter: "@mouseenter",
  onmouseleave: "@mouseleave",
  onmousedown: "@mousedown",
  onmouseup: "@mouseup",
  onmousemove: "@mousemove",
  onmouseover: "@mouseover",
  onmouseout: "@mouseout",
  oncontextmenu: "@contextmenu",
  onwheel: "@wheel",
  ondrag: "@drag",
  ondragstart: "@dragstart",
  ondragend: "@dragend",
  ondragenter: "@dragenter",
  ondragleave: "@dragleave",
  ondragover: "@dragover",
  ondrop: "@drop",
  onscroll: "@scroll",
  onresize: "@resize",
  onload: "@load",
  onunload: "@unload",
  onerror: "@error",
  onabort: "@abort",
  onhashchange: "@hashchange",
  onpopstate: "@popstate",
  onpageshow: "@pageshow",
  onpagehide: "@pagehide",
  onbeforeunload: "@beforeunload",
  onoffline: "@offline",
  ononline: "@online",
  onmessage: "@message",
  onmessageerror: "@messageerror",
  onshow: "@show",
  ontoggle: "@toggle",
  oninvalid: "@invalid",
  onreset: "@reset",
  onsearch: "@search",
  onselect: "@select",
  onselectstart: "@selectstart",
  onselectionchange: "@selectionchange",
  oncopy: "@copy",
  oncut: "@cut",
  onpaste: "@paste",
  onbeforecopy: "@beforecopy",
  onbeforecut: "@beforecut",
  onbeforepaste: "@beforepaste",
} as const;

const RENDER_OPTIONS = {
  attributeMap: ATTRIBUTE_MAP,
} as const;

type EventHandlerFunction<E extends Event = Event> = (
  event: E,
) => void;

declare global {
  namespace JSXTE {
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
      ondrag: EventHandlerFunction;
      ondragstart: EventHandlerFunction;
      ondragend: EventHandlerFunction;
      ondragenter: EventHandlerFunction;
      ondragleave: EventHandlerFunction;
      ondragover: EventHandlerFunction;
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
    }
  }
}
