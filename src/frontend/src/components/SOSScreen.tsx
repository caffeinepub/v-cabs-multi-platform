import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, CheckCircle, Phone } from "lucide-react";
import { useState } from "react";
import type { SOSEvent, User } from "../types/vcabs";

interface SOSScreenProps {
  user: User;
  onBack: () => void;
  onSOS: (event: SOSEvent) => void;
}

const EMERGENCY_CONTACTS = [
  { name: "Police", number: "100", icon: "🚔" },
  { name: "Ambulance", number: "108", icon: "🚑" },
  { name: "V Cabs Emergency", number: "1800-VCB-HELP", icon: "🆘" },
];

export default function SOSScreen({ user, onBack, onSOS }: SOSScreenProps) {
  const [triggered, setTriggered] = useState(false);
  const [pressing, setPressing] = useState(false);

  const triggerSOS = () => {
    if (triggered) return;
    // Vibrate if supported
    if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 300]);
    const event: SOSEvent = {
      id: `sos_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      role: user.role,
      city: user.city ?? "Unknown",
      location: user.savedAddresses?.home ?? "Location not available",
      timestamp: new Date().toISOString(),
    };
    onSOS(event);
    setTriggered(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-950 to-red-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4">
        <button
          type="button"
          onClick={onBack}
          className="text-white/80 hover:text-white"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="text-white font-bold text-lg">SOS Emergency</span>
      </div>

      {/* Main SOS area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
        {triggered ? (
          <div className="text-center space-y-4">
            <div className="w-28 h-28 rounded-full bg-green-500 flex items-center justify-center mx-auto animate-pulse">
              <CheckCircle className="w-14 h-14 text-white" />
            </div>
            <h2 className="text-white text-2xl font-bold">Alert Sent!</h2>
            <p className="text-white/80 text-sm max-w-xs">
              Your emergency alert has been sent to the V Cabs safety team. Help
              is on the way.
            </p>
            <div className="bg-white/10 rounded-xl px-4 py-3 text-white text-sm">
              <p className="font-semibold">
                Alert ID: {`SOS-${Date.now().toString().slice(-6)}`}
              </p>
              <p className="text-white/70 text-xs mt-1">
                {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <h2 className="text-white text-xl font-bold">
                Are you in danger?
              </h2>
              <p className="text-white/70 text-sm mt-1">
                Press and hold SOS button to alert emergency services
              </p>
            </div>

            {/* Big SOS Button */}
            <button
              data-ocid="sos.button"
              type="button"
              onMouseDown={() => setPressing(true)}
              onMouseUp={() => {
                setPressing(false);
                triggerSOS();
              }}
              onTouchStart={() => setPressing(true)}
              onTouchEnd={() => {
                setPressing(false);
                triggerSOS();
              }}
              onClick={triggerSOS}
              className={`w-44 h-44 rounded-full border-8 border-red-300 bg-red-500 text-white flex flex-col items-center justify-center transition-all duration-150 shadow-2xl select-none ${
                pressing
                  ? "scale-95 bg-red-700 shadow-inner"
                  : "hover:bg-red-600 active:scale-95"
              }`}
            >
              <span className="text-5xl font-black tracking-widest">SOS</span>
              <span className="text-xs font-medium mt-1 opacity-80">
                PRESS & HOLD
              </span>
            </button>
          </>
        )}

        {/* Emergency Contacts */}
        <div className="w-full max-w-sm space-y-3">
          <p className="text-white/60 text-xs text-center uppercase tracking-wider font-semibold">
            Emergency Contacts
          </p>
          {EMERGENCY_CONTACTS.map((contact, i) => (
            <a
              key={contact.number}
              href={`tel:${contact.number}`}
              data-ocid={
                i === 0
                  ? "sos.police_link"
                  : i === 1
                    ? "sos.ambulance_link"
                    : "sos.vcabs_link"
              }
              className="flex items-center justify-between bg-white/10 hover:bg-white/20 rounded-xl px-4 py-3.5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{contact.icon}</span>
                <div>
                  <p className="text-white font-semibold text-sm">
                    {contact.name}
                  </p>
                  <p className="text-white/60 text-xs">{contact.number}</p>
                </div>
              </div>
              <Phone className="w-5 h-5 text-green-400" />
            </a>
          ))}
        </div>
      </div>

      <div className="px-6 pb-8">
        <Button
          variant="ghost"
          onClick={onBack}
          className="w-full text-white/60 hover:text-white hover:bg-white/10"
        >
          Go Back to App
        </Button>
      </div>
    </div>
  );
}
