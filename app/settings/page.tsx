"use client";

import Link from "next/link";
import { KeyRound, Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="w-full h-full flex flex-col overflow-hidden text-white">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
          <SettingsIcon className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-gray-400">Admin panel configuration</p>
        </div>
      </div>

      <div className="bg-[#252350] border border-gray-800 rounded-2xl p-5">
        <div className="font-semibold mb-3">Integrations</div>

        <Link
          href="/settings/integrations/ai-agent"
          className="flex items-center justify-between p-4 rounded-xl bg-gray-900 border border-gray-800 hover:bg-gray-850 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold">AI Agent</div>
              <div className="text-xs text-gray-400">API keys + scopes for Create/Publish/Resolve</div>
            </div>
          </div>
          <div className="text-xs text-gray-400">Open →</div>
        </Link>
      </div>
    </div>
  );
}
