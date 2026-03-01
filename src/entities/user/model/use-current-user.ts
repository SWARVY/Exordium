import { useSuspenseQuery } from "@suspensive/react-query-5"

import { userQueryOptions } from "../api/user-query-options"

export function useCurrentUser() {
  const { data } = useSuspenseQuery(userQueryOptions.currentUser())
  return data
}
