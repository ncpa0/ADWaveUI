export class Dt {
  static isParsable(date: string) {
    const ts = Date.parse(date);
    if (isNaN(ts)) {
      return false;
    }
    return true;
  }

  static parse(date: string) {
    const ts = Date.parse(date);
    if (!isNaN(ts)) {
      return new Dt(new Date(ts));
    }
    throw new Error("Invalid date format.");
  }

  private _locale = navigator.language;

  constructor(private _date: Date = new Date(), locale?: string) {
    if (locale) {
      this._locale = locale;
    }
  }

  // mutators

  setLocale(l: string) {
    this._locale = l;
    return this;
  }

  setYear(y: number) {
    this._date.setFullYear(y);
    return this;
  }

  setMonth(m: number) {
    this._date.setMonth(m - 1);
    return this;
  }

  startOfMonth() {
    this._date.setDate(1);
    return this;
  }

  endOfMonth() {
    this._date.setDate(this.countDaysOfThisMonth());
    return this;
  }

  setHour(h: number, m: number, sec: number) {
    this._date.setHours(h);
    this._date.setMinutes(m);
    this._date.setSeconds(sec);
    this._date.setMilliseconds(0);
    return this;
  }

  setDay(d: number) {
    d = Math.max(0, d);
    d = Math.min(this.countDaysOfThisMonth(), d);
    this._date.setDate(d);
    return this;
  }

  plus(amounts: { days?: number }) {
    if (amounts.days != null) {
      this._date.setDate(this._date.getDate() + Math.abs(amounts.days));
    }
    return this;
  }

  minus(amounts: { days?: number }) {
    if (amounts.days != null) {
      this._date.setDate(this._date.getDate() - Math.abs(amounts.days));
    }
    return this;
  }

  // getters

  year() {
    return this._date.getFullYear();
  }

  month() {
    return this._date.getMonth() + 1;
  }

  monthString() {
    return new Intl.DateTimeFormat(this._locale, {
      month: "long",
    }).format(this._date);
  }

  dayOfMonth(type?: "padded") {
    if (type === "padded") {
      return new Intl.DateTimeFormat(this._locale, {
        day: "2-digit",
      }).format(this._date);
    }
    return new Intl.DateTimeFormat(this._locale, {
      day: "numeric",
    }).format(this._date);
  }

  dayOfWeek() {
    const d = this._date.getDay();
    if (d === 0) return 7;
    return d;
  }

  dayOfWeekString(format: "long" | "short" | "narrow" = "long") {
    return new Intl.DateTimeFormat(this._locale, {
      weekday: format,
    }).format(this._date);
  }

  countDaysOfThisMonth() {
    const nextMonth = new Date(
      this._date.getFullYear(),
      this._date.getMonth() + 1,
      1,
    );
    nextMonth.setDate(nextMonth.getDate() - 1);
    return nextMonth.getDate();
  }

  localeString(dateStyle: "full" | "long" | "medium" | "short" = "long") {
    return new Intl.DateTimeFormat(this._locale, {
      dateStyle,
    }).format(this._date);
  }

  iso() {
    return this._date.toISOString();
  }

  isoDate() {
    return `${this.year()}-${String(this.month()).padStart(2, "0")}-${
      String(this.dayOfMonth("padded"))
    }`;
  }

  jsDate() {
    const d = new Date(this._date);
    return d;
  }

  unix() {
    return this._date.getTime();
  }

  clone() {
    const d = new Date(this._date);
    return new Dt(d).setLocale(this._locale);
  }

  // utility

  isSameDate(d: Dt) {
    return this.year() == d.year()
      && this.month() == d.month()
      && this.dayOfMonth() == d.dayOfMonth();
  }
}
