module Api
  module V1
    module Admin
      class ProjectFilesController < ApplicationController
        before_action :authenticate_user!
        before_action :require_admin!
        before_action :set_project
        before_action :set_attachment, only: [:show, :destroy]

        # GET /api/v1/admin/projects/:project_id/files
        def index
          render json: @project.files.map { |att| attachment_json(att) }, status: :ok
        end

        # POST /api/v1/admin/projects/:project_id/files
        # multipart/form-data with files[] (supports multiple uploads)
        def create
          files = params[:files]

          unless files.present?
            return render json: { error: "No files uploaded" }, status: :unprocessable_entity
          end

          Array(files).each { |f| @project.files.attach(f) }

          render json: @project.files.map { |att| attachment_json(att) }, status: :created
        end

        # GET /api/v1/admin/projects/:project_id/files/:id
        def show
          blob = @attachment.blob
          send_data blob.download,
                    filename: blob.filename.to_s,
                    content_type: blob.content_type,
                    disposition: "attachment"
        end

        # DELETE /api/v1/admin/projects/:project_id/files/:id
        def destroy
          @attachment.purge
          head :no_content
        end

        private

        def set_project
          @project = Project.find_by(id: params[:project_id])
          render json: { error: "Project not found" }, status: :not_found unless @project
        end

        def set_attachment
          @attachment = @project&.files&.find { |a| a.id.to_s == params[:id].to_s }
          render json: { error: "File not found" }, status: :not_found unless @attachment
        end

        def attachment_json(att)
          blob = att.blob
          {
            id: att.id,
            filename: blob.filename.to_s,
            content_type: blob.content_type,
            byte_size: blob.byte_size,
            created_at: blob.created_at
          }
        end
      end
    end
  end
end
