"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/shared";
import { AddFriendModal } from "@/components/admin/modals/AddFriendModal";
import { useUIStore } from "@/lib/store/ui-store";
import { playSound } from "@/lib/sounds";

export default function AddFriendPage() {
  const router = useRouter();
  const { setOpenModal } = useUIStore();
  const [showModal, setShowModal] = useState(true);

  useEffect(() => {
    setOpenModal("add-friend-modal");
  }, [setOpenModal]);

  const handleClose = () => {
    setShowModal(false);
    setOpenModal(null);
    playSound("close");
    router.push("/admin/friends");
  };

  const handleFriendAdded = () => {
    setShowModal(false);
    setOpenModal(null);
    playSound("success");
    router.push("/admin/friends");
  };

  return (
    <>
      <Navigation />
      <div className="admin-page">
        <AddFriendModal
          isOpen={showModal}
          onClose={handleClose}
          onFriendAdded={handleFriendAdded}
        />
      </div>
    </>
  );
}
