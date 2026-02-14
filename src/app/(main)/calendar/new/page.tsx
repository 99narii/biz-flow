import { Suspense } from "react";
import ScheduleForm from "@/components/schedule/ScheduleForm";
import Spinner from "@/components/common/Spinner";
import PageLayout from "@/components/layout/PageLayout";

function LoadingFallback() {
  return (
    <PageLayout title="일정 등록">
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
        <Spinner size="lg" />
      </div>
    </PageLayout>
  );
}

export default function NewSchedulePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ScheduleForm />
    </Suspense>
  );
}
