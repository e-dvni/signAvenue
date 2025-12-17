module Api
  module V1
    class ProjectFilesController < ApplicationController
      before_action :authenticate_user!
      before_action :set_project
      before_action :set_attachment, only: [:show]

      # GET /api/v1/projects/:project_id/files
      def index
        render json: @project.files.map { |att| attachment_json(att) }, status: :ok
      end

      # GET /api/v1/projects/:project_id/files/:id
      # Authenticated download for customers (so Authorization header is respected)
      def show
        blob = @attachment.blob
        send_data blob.download,
                  filename: blob.filename.to_s,
                  content_type: blob.content_type,
                  disposition: "attachment"
      end

      private

      def set_project
        @project = current_user.projects.find_by(id: params[:project_id])
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
