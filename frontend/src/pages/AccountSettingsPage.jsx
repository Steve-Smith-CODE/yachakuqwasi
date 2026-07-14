import { useState } from "react";
import { Camera, User, Lock, ShieldCheck, Save, GraduationCap } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { updateProfileRequest, updatePasswordRequest, uploadAvatarRequest, updateInstitutionalEmailRequest } from "../api/profile.js";
import { ApiError } from "../api/client.js";
import { fileToDataUrl } from "../utils/files.js";
import { UNSCH_ACADEMIC_MAP, FACULTIES } from "../constants/content.js";
import makiMascot from "../assets/images/maki-mascota.webp";

const ROLE_LABEL = { student: "Estudiante", landlord: "Arrendador", admin: "Administrador" };

export default function AccountSettingsPage() {
  const { user, token, updateUser } = useAuth();

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  const [name, setName] = useState(user.name || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [faculty, setFaculty] = useState(user.faculty || FACULTIES[0]);
  const [career, setCareer] = useState(user.career || (UNSCH_ACADEMIC_MAP[user.faculty]?.[0] ?? ""));
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const [institutionalEmail, setInstitutionalEmail] = useState(user.institutional_email || "");
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setAvatarError("");
    setUploadingAvatar(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const { profile } = await uploadAvatarRequest(token, dataUrl);
      updateUser({ avatar_url: profile.avatar_url });
    } catch (err) {
      setAvatarError(err instanceof ApiError ? err.message : "No se pudo actualizar la foto.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    setSavingProfile(true);
    try {
      const fields = { name, phone };
      if (user.role === "student") {
        fields.faculty = faculty;
        fields.career = career;
      }
      const { profile } = await updateProfileRequest(token, fields);
      updateUser(profile);
      setProfileSuccess("Datos actualizados correctamente.");
    } catch (err) {
      setProfileError(err instanceof ApiError ? err.message : "No se pudieron guardar los cambios.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleInstitutionalEmailSubmit(e) {
    e.preventDefault();
    setEmailError("");
    setEmailSuccess("");
    setSavingEmail(true);
    try {
      const { profile } = await updateInstitutionalEmailRequest(token, institutionalEmail);
      updateUser(profile);
      setEmailSuccess("Correo institucional guardado.");
    } catch (err) {
      setEmailError(err instanceof ApiError ? err.message : "No se pudo guardar el correo institucional.");
    } finally {
      setSavingEmail(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    if (newPassword.length < 6) {
      setPasswordError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden.");
      return;
    }
    setSavingPassword(true);
    try {
      await updatePasswordRequest(token, newPassword);
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess("Contraseña actualizada correctamente.");
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : "No se pudo cambiar la contraseña.");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-guindo animate-pulse" />
          <span className="text-[10px] font-black text-guindo uppercase tracking-wider font-mono">Mi Cuenta</span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">Configurar Cuenta</h2>
        <p className="text-slate-500 text-xs mt-1">Actualiza tu foto, tus datos personales y tu contraseña.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row items-center gap-6 animate-fade-in">
        <div className="relative h-24 w-24 shrink-0">
          <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-guindo/30 bg-[#FDFBF7] shadow-md">
            <img
              src={user.avatar_url || makiMascot}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          </div>
          <label className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-guindo text-white flex items-center justify-center border-2 border-white shadow-md cursor-pointer hover:bg-guindo-dark transition-all active:scale-90">
            <Camera className="h-3.5 w-3.5" />
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={uploadingAvatar} />
          </label>
        </div>
        <div className="text-center sm:text-left space-y-1">
          <h4 className="text-sm font-black text-slate-900">{user.name}</h4>
          <span className="text-[10px] font-black text-guindo uppercase tracking-wider bg-guindo/10 px-2 py-0.5 rounded-full inline-block">
            {ROLE_LABEL[user.role] || user.role}
          </span>
          {user.is_verified && (
            <span className="ml-1.5 text-[10px] font-black text-amber-700 uppercase tracking-wider bg-amber-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Verificado
            </span>
          )}
          <p className="text-[11px] text-slate-400">{uploadingAvatar ? "Subiendo foto..." : "Haz clic en la cámara para cambiar tu foto"}</p>
          {avatarError && <p className="text-[11px] text-red-600 font-semibold">{avatarError}</p>}
        </div>
      </div>

      <form onSubmit={handleProfileSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4 animate-fade-in">
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <User className="h-4 w-4 text-guindo" />
          <span>Datos Personales</span>
        </h4>

        {profileError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 text-red-700 text-xs font-semibold rounded-r">{profileError}</div>
        )}
        {profileSuccess && (
          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 text-emerald-700 text-xs font-semibold rounded-r">{profileSuccess}</div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Nombre Completo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs bg-slate-50 font-medium"
              required
            />
          </div>
          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Teléfono Móvil</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs bg-slate-50 font-medium"
            />
          </div>
        </div>

        {user.role === "student" && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Facultad Académica</label>
              <select
                value={faculty}
                onChange={(e) => {
                  const selectedFac = e.target.value;
                  setFaculty(selectedFac);
                  const relatedCareers = UNSCH_ACADEMIC_MAP[selectedFac] || [];
                  if (relatedCareers.length > 0) setCareer(relatedCareers[0]);
                }}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs bg-slate-50 font-bold text-slate-700 cursor-pointer"
              >
                {FACULTIES.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Carrera Profesional</label>
              <select
                value={career}
                onChange={(e) => setCareer(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs bg-slate-50 font-bold text-slate-700 cursor-pointer"
              >
                {(UNSCH_ACADEMIC_MAP[faculty] || []).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={savingProfile}
          className="bg-guindo text-white py-2.5 px-5 rounded-xl text-xs font-black hover:bg-guindo-dark transition-all shadow-md uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          <span>{savingProfile ? "Guardando..." : "Guardar Cambios"}</span>
        </button>
      </form>

      <form onSubmit={handleInstitutionalEmailSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4 animate-fade-in">
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <GraduationCap className="h-4 w-4 text-guindo" />
          <span>Correo Institucional</span>
        </h4>
        <p className="text-[11px] text-slate-400 -mt-2">
          Declara tu correo institucional como una señal de confianza adicional (debe pertenecer a una institución verificada por el administrador). No reemplaza la revisión de tus documentos.
        </p>

        {emailError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 text-red-700 text-xs font-semibold rounded-r">{emailError}</div>
        )}
        {emailSuccess && (
          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 text-emerald-700 text-xs font-semibold rounded-r">{emailSuccess}</div>
        )}
        {user.institutional_email && !emailSuccess && (
          <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
            <GraduationCap className="h-3 w-3" /> Declarado: {user.institutional_email}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            placeholder="tunombre@unsch.edu.pe"
            value={institutionalEmail}
            onChange={(e) => setInstitutionalEmail(e.target.value)}
            className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs bg-slate-50 font-medium"
            required
          />
          <button
            type="submit"
            disabled={savingEmail}
            className="bg-guindo text-white py-2.5 px-5 rounded-xl text-xs font-black hover:bg-guindo-dark transition-all shadow-md uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{savingEmail ? "Guardando..." : "Guardar"}</span>
          </button>
        </div>
      </form>

      <form onSubmit={handlePasswordSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4 animate-fade-in">
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <Lock className="h-4 w-4 text-guindo" />
          <span>Cambiar Contraseña</span>
        </h4>

        {passwordError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 text-red-700 text-xs font-semibold rounded-r">{passwordError}</div>
        )}
        {passwordSuccess && (
          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 text-emerald-700 text-xs font-semibold rounded-r">{passwordSuccess}</div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Nueva Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs bg-slate-50 font-medium"
              required
            />
          </div>
          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Confirmar Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs bg-slate-50 font-medium"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={savingPassword}
          className="bg-guindo text-white py-2.5 px-5 rounded-xl text-xs font-black hover:bg-guindo-dark transition-all shadow-md uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          <span>{savingPassword ? "Actualizando..." : "Actualizar Contraseña"}</span>
        </button>
      </form>
    </div>
  );
}
