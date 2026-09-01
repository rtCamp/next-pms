/**
 * External dependencies.
 */
import { Avatar, Button } from "@rtcamp/frappe-ui-react";

import type { SettingsPageProps } from "../types";

export function ProfilePage({ displayName, email, image }: SettingsPageProps) {
  return (
    <div className="max-w-3xl">
      <div>
        <h2 className="text-xl font-semibold text-ink-gray-8">Profile</h2>
        <p className="mt-1 text-base text-ink-gray-6">
          Manage your profile and login information.
        </p>
      </div>
      <div className="mt-8 flex items-center gap-2 pb-8 pt-1.5">
        <Avatar label={displayName} image={image || undefined} size="3xl" />
        <div className="min-w-0">
          <p className="truncate text-xl font-semibold text-ink-gray-8">
            {displayName}
          </p>
          <p className="truncate text-p-sm text-ink-gray-6">{email}</p>
        </div>
      </div>
      <section>
        <h3 className="text-lg font-semibold text-ink-gray-8">
          Account Info and Security
        </h3>
        <div className="mt-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-base font-medium text-ink-gray-8">Password</p>
            <p className="mt-1 text-p-sm text-ink-gray-6">
              Change your account password for security.
            </p>
          </div>
          <Button
            variant="subtle"
            label="Change Password"
            onClick={() => window.location.assign("/update-password")}
          />
        </div>
      </section>
    </div>
  );
}
