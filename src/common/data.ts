export function toSerializable(data: any): any {
  if (!data) {
    return data;
  }
  if (data instanceof Date) {
    return { __date__: data.getTime() };
  }
  if (data instanceof Error) {
    return { __error__: data.message };
  }
  if (data instanceof Set) {
    const list = Array.from(data);
    for (let i = 0; i < list.length; i++) {
      list[i] = toSerializable(list[i]);
    }
    return { __set__: list };
  }
  if (data instanceof Map) {
    const entries = Array.from(data.entries());
    for (let i = 0; i < entries.length; i++) {
      entries[i] = toSerializable(entries[i]);
    }
    return { __map__: entries };
  }
  if (Array.isArray(data)) {
    return data.map(toSerializable);
  }
  if (typeof data === 'object') {
    const obj: any = {};
    for (const key in data) {
      obj[key] = toSerializable(data[key]);
    }
    return obj;
  }
  return data;
}

export function formSerializable(data: any): any {
  if (!data) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(formSerializable);
  }
  if (typeof data === 'object') {
    if ('__date__' in data) {
      return new Date(data.__date__);
    }
    if ('__error__' in data) {
      return new Error(data.__error__);
    }
    if ('__set__' in data) {
      return new Set(data.__set__.map(formSerializable));
    }
    if ('__map__' in data) {
      return new Map(data.__map__.map(formSerializable));
    }
    const obj: any = {};
    for (const key in data) {
      obj[key] = formSerializable(data[key]);
    }
    return obj;
  }
  return data;
}