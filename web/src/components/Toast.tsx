import { useAppState } from '../state/AppState'

export function Toast() {
  const {
    state: {
      ui: { toastMessage },
    },
  } = useAppState()

  if (!toastMessage) {
    return null
  }

  return <div className="toast show">{toastMessage}</div>
}
