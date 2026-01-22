CREATE INDEX "document_summary_document_id_idx" ON "document_summary" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "documents_user_id_idx" ON "documents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "documents_folder_id_idx" ON "documents" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX "documents_status_idx" ON "documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "documents_user_id_created_at_idx" ON "documents" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "documents_name_idx" ON "documents" USING btree ("name");--> statement-breakpoint
CREATE INDEX "folder_user_id_idx" ON "folders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_id" ON "session" USING btree ("user_id");