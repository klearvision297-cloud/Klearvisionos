import { ipcMain } from "electron";
import { OpticalService } from "../services/OpticalService";
import type {
  BulkUpdateOpticalJobsDTO,
  CreateAvailabilityProfileDTO,
  CreateLensSeriesDTO,
  CompleteQualityInspectionDTO,
  DispatchLabOrdersDTO,
  EvaluateAvailabilityDTO,
  LensSeriesQuery,
  OpticalLabJobQuery,
  OpticalJobQuery,
  ReceiveLabOrderDTO,
  UpdateOpticalJobDTO,
} from "../types/optical";

const service = new OpticalService();

export function registerOpticalIpc() {
  ipcMain.handle("optical:jobs", (_, query?: OpticalJobQuery) => service.getJobs(query));
  ipcMain.handle("optical:job-detail", (_, jobId: number) => service.getJobDetail(jobId));
  ipcMain.handle("optical:job-update", (_, jobId: number, data: UpdateOpticalJobDTO) => service.updateJob(jobId, data));
  ipcMain.handle("optical:jobs-bulk-update", (_, data: BulkUpdateOpticalJobsDTO) => service.bulkUpdateJobs(data));
  ipcMain.handle("optical:customer-notified", (_, jobId: number, notes?: string) => service.notifyCustomer(jobId, notes));
  ipcMain.handle("optical:warranty", (_, jobId: number, warrantyUntil: string, notes?: string) => service.recordWarranty(jobId, warrantyUntil, notes));
  ipcMain.handle("optical:timeline", (_, jobId: number) => service.getJobDetail(jobId).timeline);
  ipcMain.handle("optical:dashboard", () => service.getDashboard());
  ipcMain.handle("optical:repair-jobs", (_, search?: string) => service.getRepairJobs(search));
  ipcMain.handle("optical:repair-job", (_, id: number) => service.getRepairJob(id));
  ipcMain.handle("optical:repair-create", (_, data) => service.createRepairJob(data));
  ipcMain.handle("optical:repair-update", (_, id: number, data) => service.updateRepairJob(id, data));

  ipcMain.handle("optical:lens-series", (_, query?: LensSeriesQuery) => service.getLensSeries(query));
  ipcMain.handle("optical:lens-summary", () => service.getLensCatalogueSummary());
  ipcMain.handle("optical:lens-create", (_, data: CreateLensSeriesDTO) => service.createLensSeries(data));
  ipcMain.handle("optical:lens-update", (_, id: number, data: CreateLensSeriesDTO) => service.updateLensSeries(id, data));
  ipcMain.handle("optical:lens-duplicate", (_, id: number) => service.duplicateLensSeries(id));
  ipcMain.handle("optical:lens-active", (_, id: number, isActive: boolean) => service.setLensSeriesActive(id, isActive));

  ipcMain.handle("optical:profiles", (_, includeInactive?: boolean) => service.getAvailabilityProfiles(includeInactive));
  ipcMain.handle("optical:profile-create", (_, data: CreateAvailabilityProfileDTO) => service.createAvailabilityProfile(data));
  ipcMain.handle("optical:profile-update", (_, id: number, data: CreateAvailabilityProfileDTO) => service.updateAvailabilityProfile(id, data));
  ipcMain.handle("optical:profile-delete", (_, id: number) => service.deleteAvailabilityProfile(id));
  ipcMain.handle("optical:evaluate-availability", (_, data: EvaluateAvailabilityDTO) => service.evaluateAvailability(data));

  ipcMain.handle("optical:lab-jobs", (_, query: OpticalLabJobQuery) => service.getLabJobs(query));
  ipcMain.handle("optical:lab-dispatch", (_, data: DispatchLabOrdersDTO) => service.dispatchLabJobs(data));
  ipcMain.handle("optical:lab-receive", (_, jobId: number, data: ReceiveLabOrderDTO) => service.receiveLabJob(jobId, data));
  ipcMain.handle("optical:qc-complete", (_, jobId: number, data: CompleteQualityInspectionDTO) => service.completeQualityInspection(jobId, data));
  ipcMain.handle("optical:return-for-remake", (_, jobId: number, performedBy?: string) => service.returnForRemake(jobId, performedBy));
  ipcMain.handle("optical:lab-receiving-summary", () => service.getLabReceivingSummary());

  ipcMain.handle("optical:search", (_, query: string) => service.search(query));
  ipcMain.handle("optical:notifications", () => service.getNotifications());
  ipcMain.handle("optical:read-notification", (_, id: number) => service.markNotificationRead(id));
}
