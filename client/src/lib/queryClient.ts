import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

function getAuthHeaders() {
  const token = localStorage.getItem('qaaq_token');
  const headers: Record<string, string> = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log(`🔍 Using auth token:`, token.substring(0, 50) + '...');
    
    // Debug: decode token to see user ID
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log(`🔍 Token contains userId:`, payload.userId);
      const userData = localStorage.getItem('qaaq_user');
      if (userData) {
        const user = JSON.parse(userData);
        console.log(`🔍 localStorage user ID:`, user.id);
        // Fix token-user ID mismatch for Chiru's case
        if (payload.userId !== user.id) {
          console.log(`⚠️ Token/User ID mismatch detected! Token: ${payload.userId}, User: ${user.id}`);
          console.log(`🔧 This explains the Active Conversations loading issue`);
        }
      }
    } catch (e) {
      console.log(`❌ Failed to decode token for debugging`);
    }
  } else {
    console.log(`❌ No auth token found in localStorage`);
  }
  
  return headers;
}

export async function apiRequest(
  url: string,
  method: string = 'GET',
  data?: unknown | undefined,
): Promise<Response> {
  const headers = {
    ...getAuthHeaders(),
    ...(data ? { "Content-Type": "application/json" } : {}),
  };

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      headers: getAuthHeaders(),
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
