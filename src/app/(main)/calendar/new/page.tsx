import { Suspense } from "react";
import ScheduleForm from "@/components/schedule/ScheduleForm";

export default function NewSchedulePage() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <ScheduleForm />
    </Suspense>
  );
}
