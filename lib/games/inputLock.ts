let locked = false;

export function setGameInputLock(value: boolean) {
  locked = value;
}

export function isGameInputLocked() {
  return locked;
}
