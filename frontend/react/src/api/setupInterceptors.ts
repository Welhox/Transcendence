import { AxiosInstance } from "axios";
import { logoutFromInterceptor } from "../auth/AuthProvider";

let isHandlingSessionExpiry = false;

const isSessionAuthFailure = (status: number, url: string): boolean => {
  const isSessionOrUserEndpoint =
    url.includes("/session") ||
    (url.includes("/users") && !url.includes("/users/login"));
  return (status === 401 || status === 419) && isSessionOrUserEndpoint;
};

export function setupInterceptors({ api }: { api: AxiosInstance }) {
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const status = error.response?.status;
      const url = error.config?.url || "";

      if (!isHandlingSessionExpiry && isSessionAuthFailure(status, url)) {
        isHandlingSessionExpiry = true;
        console.warn(
          `Session expired (status: ${status}) on ${url} — refreshing session and redirecting`
        );

        logoutFromInterceptor?.(); // update context immediately
        localStorage.removeItem("language");

        // reset lock after short delay
        setTimeout(() => {
          isHandlingSessionExpiry = false;
        }, 2000);
      }
      return Promise.reject(error);
    }
  );
}
