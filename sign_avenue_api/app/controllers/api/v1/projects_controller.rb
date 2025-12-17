module Api
  module V1
    class ProjectsController < ApplicationController
      before_action :authenticate_user!

      # GET /api/v1/projects
      # List projects for the current logged-in user
      def index
        projects = current_user.projects.order(created_at: :desc)
        render json: projects.map { |project| project_json(project) }, status: :ok
      end

      # GET /api/v1/projects/:id
      # Show a single project (only if it belongs to current_user)
      def show
        project = current_user.projects.find_by(id: params[:id])

        if project
          render json: project_json(project), status: :ok
        else
          render json: { error: "Project not found" }, status: :not_found
        end
      end

      # PATCH /api/v1/projects/:id
      # Customer booking / cancelling installation slot
      def update
        project = current_user.projects.find_by(id: params[:id])
        return render json: { error: "Project not found" }, status: :not_found unless project

        new_date = project_params[:install_date]
        new_slot = project_params[:install_slot]

        # Is this a cancellation? (clear both)
        is_cancellation = new_date.blank? && new_slot.blank?

        # If project already has a booking AND this is NOT a cancellation,
        # block direct rescheduling – they must cancel first.
        if project.install_date.present? &&
           project.install_slot.present? &&
           !is_cancellation
          return render json: {
            error: "This project already has a scheduled installation. Please cancel the existing appointment first, then book a new time."
          }, status: :unprocessable_entity
        end

        if project.update(project_params)
          render json: project_json(project), status: :ok
        else
          render json: { error: project.errors.full_messages.to_sentence }, status: :unprocessable_entity
        end
      end

      # POST /api/v1/projects/:id/cancel_install
      def cancel_install
        project = current_user.projects.find_by(id: params[:id])
        return render json: { error: "Project not found" }, status: :not_found unless project

        project.install_date = nil
        project.install_slot = nil

        if project.save
          render json: project_json(project), status: :ok
        else
          render json: { error: project.errors.full_messages.to_sentence }, status: :unprocessable_entity
        end
      end

      private

      # Only allow customers to change install_date & install_slot
      def project_params
        params.require(:project).permit(:install_date, :install_slot)
      end

      def project_json(project)
        {
          id: project.id,
          name: project.name,
          status: project.status,
          location: project.location,
          install_date: project.install_date,
          install_slot: project.install_slot,
          description: project.description,
          can_schedule: project.status == "ready_for_install",
          created_at: project.created_at,
          updated_at: project.updated_at
        }
      end
    end
  end
end
