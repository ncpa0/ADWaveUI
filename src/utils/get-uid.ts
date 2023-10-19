const UID_LEN = 8;

export const getUid = () => {
  const uid = Math.random().toString(36).substring(2, UID_LEN);
  return ":" + uid + ":";
};
