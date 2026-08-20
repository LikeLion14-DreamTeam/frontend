export const mockPermissionEvents = []

export const recordMockPermissionEvent = (permissionEvent) => {
  const recordedEvent = { ...permissionEvent }

  mockPermissionEvents.push(recordedEvent)

  return recordedEvent
}
