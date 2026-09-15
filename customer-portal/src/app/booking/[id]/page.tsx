"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function BookingByIdRedirect() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.id as string;

  useEffect(() => {
    if (serviceId) {
      router.replace(`/booking?serviceId=${serviceId}`);
    } else {
      router.replace("/booking");
    }
  }, [serviceId, router]);

  return null;
}