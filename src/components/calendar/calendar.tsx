import "../../base-elements";
import { ReadonlySignal, sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Button, Typography } from "adwavecss";
import { AttributesOf, customElement, EventNamesOf } from "wc_toolkit";
import { Dt } from "./date";

function Btn(
  { flat, color, disabled, linked, pill, toggled, shape, ...props }:
    & JSX.IntrinsicElements["button"]
    & {
      flat?: boolean;
      color?: "primary" | "danger";
      disabled?: boolean;
      linked?: boolean;
      pill?: boolean;
      toggled?: boolean;
      shape?: "circular" | "square";
    },
) {
  let cls: Record<string, boolean> = {};

  if (typeof props.class == "object") {
    Object.assign(cls, props.class);
  } else if (Array.isArray(props.class)) {
    for (const elem of props.class) {
      cls[elem] = true;
    }
  } else if (typeof props.class === "string") {
    cls[props.class] = true;
  }

  cls[
    Button.className({
      flat,
      color,
      disabled,
      linked,
      pill,
      toggled,
      shape,
    })
  ] = true;

  return (
    <button
      {...props}
      class={cls}
    />
  );
}

function strBool(s: ReadonlySignal<boolean>): ReadonlySignal<string> {
  return s.derive(s => s ? "true" : "false");
}

class DateChangeEvent extends Event {
  declare readonly type: "change";
  value: Date;

  constructor(type: string, value: Date) {
    super("change", {
      bubbles: true,
      cancelable: true,
    });
    this.value = value;
  }
}

class DateModeChangeEvent extends Event {
  declare readonly type: "modechange";
  value: "day" | "month" | "year";

  constructor(type: string, value: "day" | "month" | "year") {
    super("modechange", {
      bubbles: true,
      cancelable: true,
    });
    this.value = value;
  }
}

class DateYearSelectEvent extends Event {
  declare readonly type: "yearselected";
  value: number;

  constructor(type: string, value: number) {
    super("yearselected", {
      bubbles: true,
      cancelable: true,
    });
    this.value = value;
  }
}

class DateMonthSelectEvent extends Event {
  declare readonly type: "monthselected";
  value: number;

  constructor(type: string, value: number) {
    super("monthselected", {
      bubbles: true,
      cancelable: true,
    });
    this.value = value;
  }
}

class DateMonthArrowPressEvent extends Event {
  declare readonly type: "montharrowpress";
  value: "prev" | "next";

  constructor(type: string, value: "prev" | "next") {
    super("montharrowpress", {
      bubbles: true,
      cancelable: true,
    });
    this.value = value;
  }
}

const { CustomElement } = customElement("adw-calendar")
  .attributes({
    value: "string",
    defaultValue: "string",
    locale: "string",
    name: "string",
    form: "string",
  })
  .events({
    "change": DateChangeEvent,
    "yearselected": DateYearSelectEvent,
    "monthselected": DateMonthSelectEvent,
    "modechange": DateModeChangeEvent,
    "montharrowpress": DateMonthArrowPressEvent,
  })
  .context((attr) => {
    const selectedDate = sig.derive(
      attr.value.signal,
      attr.locale.signal,
      (v, locale) => {
        if (v && Dt.isParsable(v)) {
          return Dt.parse(v).setLocale(locale ?? navigator.language);
        }
        return new Dt().setLocale(locale ?? navigator.language);
      },
    );

    return {
      selectedDate,
      visibleDate: sig(selectedDate.get().clone()),
      selectMode: sig<"day" | "month" | "year">("day"),
      yearsPage: sig(0),
    };
  })
  .methods((api) => {
    return {
      setYear(y: number) {
        api.context.visibleDate.dispatch(d => {
          d = d.clone();
          d.setYear(y);
          return d;
        });
      },
      setMonth(m: number) {
        api.context.visibleDate.dispatch(d => {
          d = d.clone();
          d.setMonth(m);
          return d;
        });
      },
      nextMonth() {
        const m = api.context.visibleDate.get().month();
        if (m === 12) {
          const y = api.context.visibleDate.get().year();
          this.setYear(y + 1);
          this.setMonth(1);
          return;
        }
        this.setMonth(m + 1);
      },
      prevMonth() {
        const m = api.context.visibleDate.get().month();
        if (m === 1) {
          const y = api.context.visibleDate.get().year();
          this.setYear(y - 1);
          this.setMonth(12);
          return;
        }
        this.setMonth(m - 1);
      },
      nextYearPage() {
        api.context.yearsPage.dispatch(p => p + 1);
      },
      prevYearPage() {
        api.context.yearsPage.dispatch(p => p - 1);
      },
      _showYearSelection(e: Event) {
        api.emitEvent(
          "modechange",
          "year",
        ).onCommit(() => {
          (e.target as HTMLElement).blur();
          api.context.yearsPage.dispatch(0);
          api.context.selectMode.dispatch("year");
        });
      },
      _showMonthSelection(e: Event) {
        api.emitEvent("modechange", "month")
          .onCommit(() => {
            (e.target as HTMLElement).blur();
            api.context.selectMode.dispatch("month");
          });
      },
      _updateLocale() {
        api.context.visibleDate.dispatch((d) => {
          const l = api.attribute.locale.get();
          if (l != null) {
            return d.clone().setLocale(l);
          }
          return d;
        });
      },
      _handleDateSelect(date: Dt) {
        api.emitEvent("change", date.jsDate())
          .onCommit(() => {
            api.attribute.value.set(date.clone().setHour(12, 0, 0).iso());
          });
      },
      _handleYearSelect(e: Event, y: number) {
        api.emitEvent("yearselected", y)
          .onCommit(() => {
            (e.target as HTMLElement).blur();
            this.setYear(y);

            api.emitEvent("modechange", "day")
              .onCommit(() => {
                api.context.selectMode.dispatch("day");
              });
          });
      },
      _handleMonthSelect(e: Event, m: number) {
        api.emitEvent("monthselected", m).onCommit(() => {
          (e.target as HTMLElement).blur();
          this.setMonth(m);

          api.emitEvent("modechange", "day")
            .onCommit(() => {
              api.context.selectMode.dispatch("day");
            });
        });
      },
      _handlePrevMonthPress(e: Event) {
        api.emitEvent("montharrowpress", "prev")
          .onCommit(() => {
            this.prevMonth();
          });
      },
      _handleNextMonthPress(e: Event) {
        api.emitEvent("montharrowpress", "next")
          .onCommit(() => {
            this.nextMonth();
          });
      },
    };
  })
  .connected((api) => {
    const { selectedDate, visibleDate } = api.context;

    if (
      api.attribute.value.get() == null
      && api.attribute.defaultValue.get() != null
    ) {
      api.attribute.value.set(api.attribute.defaultValue.get());
    }

    // on mount assign the current date as the visible one
    visibleDate.dispatch(selectedDate.get().clone());

    api.method._updateLocale();
    api.onChange([api.attribute.locale], () => {
      api.method._updateLocale();
    });

    const year = visibleDate.derive(d => d.year().toFixed(0));
    const month = visibleDate.derive(d => d.monthString());
    const firstDay = visibleDate.derive(d => {
      return d.clone().startOfMonth();
    });
    const lastDay = visibleDate.derive(d => {
      return d.clone().endOfMonth();
    });

    const monday = visibleDate.get().clone().minus({
      days: visibleDate.get().dayOfWeek() - 1,
    });

    const html = (
      <div class="adw-calendar" role="application" aria-label="Calendar">
        <Btn
          flat
          onclick={api.method._showYearSelection}
          class={{
            "year-selector": true,
            hidden: sig.eq(api.context.selectMode, "year"),
          }}
          aria-label={sig
            .literal`Current year: ${year}. Click to select a different year.`}
          aria-hidden={strBool(sig.eq(api.context.selectMode, "year"))}
        >
          {year}
        </Btn>
        <div
          class={{
            "month-selector": true,
            hidden: api.context.selectMode.derive(m =>
              m === "month" || m === "year"
            ),
          }}
          role="toolbar"
          aria-label="Month Navigation"
          aria-hidden={strBool(api.context.selectMode.derive(m =>
            m === "month" || m === "year"
          ))}
        >
          <Btn
            flat
            onclick={api.method._handlePrevMonthPress}
            aria-label="Previous Month"
            title="Previous Month"
          >
            {"◂"}
          </Btn>
          <Btn
            flat
            class="month-btn"
            onclick={api.method._showMonthSelection}
            aria-label={sig
              .literal`Current month: ${month}. Click to select a different month.`}
          >
            {month}
          </Btn>
          <Btn
            flat
            onclick={api.method._handleNextMonthPress}
            aria-label="Next Month"
            title="Next Month"
          >
            {"▸"}
          </Btn>
        </div>
        <div
          class={{
            "days-grid": true,
            visible: sig.eq(api.context.selectMode, "day"),
          }}
          role="grid"
          aria-hidden={strBool(sig.not(sig.eq(api.context.selectMode, "day")))}
        >
          {Array.from({ length: 7 }, (_, idx) => {
            const d = monday.clone().plus({ days: idx });
            return (
              <span
                class={[Typography.text, "header-day"]}
                role="columnheader"
                aria-label={d.dayOfWeekString("long")}
              >
                {d.dayOfWeekString("narrow")}
              </span>
            );
          })}
          {firstDay.derive(f => {
            const weekDay = f.dayOfWeek();

            return (
              <div style={{ display: "contents" }}>
                {Array.from(
                  { length: weekDay - 1 },
                  (_, idx) => {
                    const d = f.clone();
                    d.minus({ days: weekDay - idx - 1 });
                    const selected = selectedDate.derive(s => s.isSameDate(d));
                    return (
                      <Btn
                        flat
                        shape="circular"
                        class={{
                          "prev-month-day": true,
                          selected,
                        }}
                        onclick={() => api.method._handleDateSelect(d)}
                        title={d.localeString()}
                        aria-label={d.localeString()}
                        aria-selected={strBool(selected)}
                      >
                        {d.dayOfMonth("padded")}
                      </Btn>
                    );
                  },
                )}
              </div>
            );
          })}
          {visibleDate.derive(date => {
            return Array.from(
              { length: date.countDaysOfThisMonth() },
              (_, idx) => {
                const d = visibleDate.get().clone();
                d.setDay(idx + 1);
                const selected = selectedDate.derive(s =>
                  s.isSameDate(d)
                );
                return (
                  <Btn
                    flat
                    shape="circular"
                    class={{
                      "curr-month-day": true,
                      selected,
                    }}
                    onclick={() => api.method._handleDateSelect(d)}
                    title={d.localeString()}
                    aria-label={d.localeString()}
                    aria-selected={strBool(selected)}
                  >
                    {d.dayOfMonth("padded")}
                  </Btn>
                );
              },
            );
          })}
          {lastDay.derive(l => {
            const weekDay = l.dayOfWeek();
            if (weekDay == 7) {
              return <></>;
            }

            return (
              <div style={{ display: "contents" }} role="row">
                {Array.from(
                  { length: 7 - weekDay },
                  (_, idx) => {
                    const d = l.clone();
                    d.plus({ days: idx + 1 });
                    const selected = selectedDate.derive(s => s.isSameDate(d));
                    return (
                      <Btn
                        flat
                        shape="circular"
                        class={{
                          "next-month-day": true,
                          selected,
                        }}
                        onclick={() => api.method._handleDateSelect(d)}
                        title={d.localeString()}
                        aria-label={d.localeString()}
                        aria-selected={strBool(selected)}
                      >
                        {d.dayOfMonth("padded")}
                      </Btn>
                    );
                  },
                )}
              </div>
            );
          })}
        </div>
        <div
          class={{
            "months-grid": true,
            visible: sig.eq(api.context.selectMode, "month"),
          }}
          role="grid"
          aria-label="Month selection"
          aria-hidden={strBool(
            sig.not(sig.eq(api.context.selectMode, "month")),
          )}
        >
          {api.attribute.locale.signal.derive(locale => {
            return Array.from({ length: 12 }, (_, idx) => {
              const d = new Dt(undefined, locale).setMonth(idx + 1);
              const selected = selectedDate.derive(s =>
                s.month() == d.month()
              );
              return (
                <Btn
                  class={{
                    selected,
                  }}
                  onclick={(e) => api.method._handleMonthSelect(e, d.month())}
                  aria-label={d.monthString()}
                  aria-selected={strBool(selected)}
                >
                  {d.monthString()}
                </Btn>
              );
            });
          })}
        </div>
        <div
          class={{
            "years-controls": true,
            visible: sig.eq(api.context.selectMode, "year"),
          }}
          role="toolbar"
          aria-label="Year navigation"
          aria-hidden={strBool(sig.not(sig.eq(api.context.selectMode, "year")))}
        >
          <Btn
            flat
            onclick={api.method.prevYearPage}
            aria-label="Previous 16 years"
          >
            {"◂"}
          </Btn>
          <Btn
            flat
            onclick={api.method.nextYearPage}
            aria-label="Next 16 years"
          >
            {"▸"}
          </Btn>
        </div>
        <div
          class={{
            "years-grid": true,
            visible: sig.eq(api.context.selectMode, "year"),
          }}
          role="grid"
          aria-label="Year selection"
          aria-hidden={strBool(sig.not(sig.eq(api.context.selectMode, "year")))}
        >
          {api.context.yearsPage.derive(p => {
            const pageStart = visibleDate.get().year() - 8 + (p * 16);

            return Array.from({ length: 16 }, (_, idx) => {
              const year = pageStart + idx;
              const selected = selectedDate.derive(s => s.year() == year);
              return (
                <Btn
                  class={{
                    selected: selected,
                  }}
                  onclick={(e) => api.method._handleYearSelect(e, year)}
                  aria-label={String(year)}
                  aria-selected={strBool(selected)}
                >
                  {String(year)}
                </Btn>
              );
            });
          })}
        </div>
        <input
          hidden
          type="date"
          name={api.attribute.name.signal}
          attribute:form={api.attribute.form.signal}
          attribute:value={api.context.selectedDate.derive(d => d.isoDate())}
          aria-hidden="true" // Hide from accessibility tree since it's an internal representation
        />
      </div>
    ) as HTMLElement;

    api.replace(html);
  })
  .register();

const AdwCalendar = CustomElement;
type AdwCalendar = InstanceType<typeof CustomElement>;

type AdwCalendarAttributes = AttributesOf<typeof AdwCalendar>;
type AdwCalendarEvents = EventNamesOf<typeof AdwCalendar>;

export { AdwCalendar };
export type {
  AdwCalendarAttributes,
  AdwCalendarEvents,
  DateChangeEvent,
  DateModeChangeEvent,
  DateMonthArrowPressEvent,
  DateMonthSelectEvent,
  DateYearSelectEvent,
};
