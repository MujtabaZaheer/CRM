import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createUserWithEmailAndPassword, reload, sendEmailVerification, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { AlertCircle, CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { auth, db } from "../firebase/config";

export const AcceptInvitation: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { firebaseUser } = useAuth();
  const [token, setToken] = useState(params.get("token") || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const createAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(credential.user);
      await signOut(auth);
      setMessage("Your access account was created. Verify the email we sent, then return here to sign in and accept the invitation.");
    } catch (err: any) {
      setError(err.message || "Unable to create your account.");
    } finally {
      setLoading(false);
    }
  };

  const signIn = async () => {
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await reload(credential.user);
      if (!credential.user.emailVerified) {
        await sendEmailVerification(credential.user);
        await signOut(auth);
        setMessage("Verify your email before accepting this invitation. A new verification email has been sent.");
        return;
      }
      setMessage("Your email is verified. You can now accept the invitation.");
    } catch (err: any) {
      setError(err.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  const accept = async () => {
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      if (!firebaseUser) throw new Error("Sign in with the invited email address first.");
      await reload(firebaseUser);
      if (!firebaseUser.emailVerified) throw new Error("Verify your email before accepting the invitation.");

      const tokenClean = token.trim();
      const invitationRef = doc(db, "invitations", tokenClean);
      const invitationSnap = await getDoc(invitationRef);
      if (!invitationSnap.exists()) throw new Error("Invitation token not found.");

      const invData = invitationSnap.data();
      if (invData.status !== "pending") throw new Error("This invitation has already been accepted or expired.");

      await setDoc(doc(db, "users", firebaseUser.uid), {
        uid: firebaseUser.uid,
        email: (firebaseUser.email || "").toLowerCase(),
        displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
        role: invData.role || "student",
        organizationId: invData.organizationId || "default_org",
        createdAt: Date.now(),
        invitedBy: invData.invitedBy || "Admin",
      });

      await updateDoc(invitationRef, {
        status: "accepted",
        acceptedAt: Date.now(),
        acceptedBy: firebaseUser.uid,
      });

      await firebaseUser.getIdToken(true);
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err.message || "Unable to accept the invitation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-500 text-zinc-950 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white">Accept EduCRM invitation</h1>
          <p className="text-sm text-zinc-400">
            Create or sign in to your verified account, then activate your assigned role.
          </p>
        </div>

        {error && (
          <div className="p-3 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
        {message && (
          <div className="p-3 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {message}
          </div>
        )}

        {!firebaseUser ? (
          <>
            <form onSubmit={createAccount} className="space-y-3">
              <label className="block text-xs text-zinc-300">
                Invited email
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-1 w-full p-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-white"
                />
              </label>
              <label className="block text-xs text-zinc-300">
                Create password
                <input
                  required
                  type="password"
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-1 w-full p-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-white"
                />
              </label>
              <button
                disabled={loading}
                type="submit"
                className="w-full py-2.5 rounded-lg bg-emerald-500 text-zinc-950 font-bold text-sm disabled:opacity-50"
              >
                {loading ? "Working..." : "Create access account"}
              </button>
            </form>
            <button
              disabled={loading || !email || !password}
              type="button"
              onClick={signIn}
              className="w-full py-2.5 rounded-lg border border-emerald-500/40 text-emerald-300 font-semibold text-sm disabled:opacity-50"
            >
              Sign in after verification
            </button>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-zinc-400 flex items-center gap-2">
              <Mail className="w-4 h-4" /> Signed in as {firebaseUser.email}
            </p>
            <label className="block text-xs text-zinc-300">
              Invitation token
              <input
                required
                value={token}
                onChange={(event) => setToken(event.target.value)}
                className="mt-1 w-full p-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-white"
              />
            </label>
            <button
              disabled={loading || !token.trim()}
              type="button"
              onClick={accept}
              className="w-full py-2.5 rounded-lg bg-emerald-500 text-zinc-950 font-bold text-sm disabled:opacity-50"
            >
              {loading ? "Activating..." : "Accept invitation"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
