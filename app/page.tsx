import ResultStudio from "./result-studio";
import LoginScreen from "./login-screen";
import { getCurrentSessionUser } from "./auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentSessionUser();
  if (!user) return <LoginScreen />;
  return <ResultStudio currentUser={{ displayName: user.displayName, username: user.username, role: user.role }} />;
}
