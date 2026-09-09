"use client";

import BoringAvatar from "boring-avatars";
import {
  getAvatarPalette,
  getAvatarVariant,
} from "@/lib/users/avatar";
import styles from "./users.module.css";

type UserAvatarProps = {
  seed: string;
  size?: number;
  square?: boolean;
  className?: string;
};

export function UserAvatar({
  seed,
  size = 40,
  square = false,
  className,
}: UserAvatarProps) {
  return (
    <span
      className={`${styles.avatarWrap} ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      <BoringAvatar
        size={size}
        square={square}
        name={seed}
        variant={getAvatarVariant(seed)}
        colors={getAvatarPalette(seed)}
      />
    </span>
  );
}
