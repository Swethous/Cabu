// src/features/mypage/components/ProfileSection.tsx
import { useState } from "react";
import { FileText, Heart, PenSquare } from "lucide-react";
import { MyProfile } from "../types";
import ProfileEditModal from "./ProfileEditModal";
import styles from "./ProfileSection.module.css";

export default function ProfileSection({ profile }: { profile: MyProfile }) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [brokenAvatarUrl, setBrokenAvatarUrl] = useState<string | null>(null);
    const canShowAvatar = Boolean(profile.avatar_url) && brokenAvatarUrl !== profile.avatar_url;

    return (
        <section className={styles.section}>
            <div className={styles.profileHeader}>
                <div className={styles.avatar}>
                    {canShowAvatar ? (
                        <img
                            src={profile.avatar_url as string}
                            alt={profile.name}
                            referrerPolicy="no-referrer"
                            onError={() => setBrokenAvatarUrl(profile.avatar_url)}
                        />
                    ) : (
                        <div className={styles.avatarPlaceholder}>{profile.name?.[0] || "?"}</div>
                    )}
                </div>
                <div className={styles.info}>
                    <h1 className={styles.name}>{profile.name}</h1>
                    <p className={styles.email}>{profile.email}</p>
                </div>
                <div className={styles.headerActions}>
                    <button
                        type="button"
                        className={styles.editButton}
                        onClick={() => setIsEditModalOpen(true)}
                    >
                        <PenSquare size={14} />
                        プロフィール編集
                    </button>
                </div>
            </div>

            <div className={styles.stats}>
                <div className={styles.statItem}>
                    <span className={styles.statIcon}><FileText size={14} /></span>
                    <span className={styles.statValue}>{profile.stats?.posts_count ?? 0}</span>
                    <span className={styles.statLabel}>投稿数</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statIcon}><Heart size={14} /></span>
                    <span className={styles.statValue}>{profile.stats?.received_likes_count ?? 0}</span>
                    <span className={styles.statLabel}>獲得いいね</span>
                </div>
            </div>

            {isEditModalOpen && (
                <ProfileEditModal profile={profile} onClose={() => setIsEditModalOpen(false)} />
            )}
        </section>
    );
}
