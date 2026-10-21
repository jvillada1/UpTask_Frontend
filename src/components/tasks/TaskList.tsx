import type { Task, TaskStatus } from "@/types/index"
import TaskCard from "./TaskCard"
import DropTask from "./DropTask"
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams } from "react-router-dom"
import { toast } from "react-toastify"
import { updateStatus } from "@/api/TaskAPI"
import { StatusTranslations } from "@/locales/es"

type TaskListProps = { 
    tasks : Task[], 
    canEdit: boolean 
} 

type GroupedTasks = { 
    [key: string]: Task[]
}

const initialStatusGroups : GroupedTasks = { 
    pending: [], 
    onHold: [], 
    inProgress: [], 
    underReview: [], 
    completed: []
} 



const statusStyles: {[key:string]:string} = { 
    pending: 'border-t-slate-500', 
    onHold: 'border-t-red-500', 
    inProgress: 'border-t-blue-500', 
    underReview: 'border-t-amber-500', 
    completed: 'border-t-emerald-500'
}


export default function TaskList({tasks,canEdit}:TaskListProps) {
    const params = useParams()
    const projectId = params.projectId!
    const queryClient = useQueryClient()

    // distance evita que un simple click (ver tarea, menú) inicie un arrastre
    const sensors = useSensors(
        useSensor(PointerSensor, {activationConstraint: {distance: 8}})
    )

    const {mutate} = useMutation({
        mutationFn: updateStatus,
        onMutate: async ({taskId, status}) => {
            await queryClient.cancelQueries({queryKey: ['project', projectId]})
            const previousProject = queryClient.getQueryData(['project', projectId])

            queryClient.setQueryData<{tasks: Task[]}>(['project', projectId], (old) => {
                if(!old) return old
                return {
                    ...old,
                    tasks: old.tasks.map(task => task._id === taskId ? {...task, status} : task)
                }
            })
            return {previousProject}
        },
        onError: (error, _variables, context) => {
            queryClient.setQueryData(['project', projectId], context?.previousProject)
            toast.error(error.message)
        },
        onSuccess: (data) => {
            toast.success(data)
        },
        onSettled: (_data, _error, {taskId}) => {
            queryClient.invalidateQueries({queryKey: ['project', projectId]})
            queryClient.invalidateQueries({queryKey: ['task', taskId]})
        }
    })

    const handleDragEnd = (e: DragEndEvent) => {
        const {over, active} = e
        if(!over) return

        const taskId = active.id.toString()
        const status = over.id as TaskStatus
        const task = tasks.find(task => task._id === taskId)
        if(!task || task.status === status) return

        mutate({projectId, taskId, status})
    }

    const groupedTasks = tasks.reduce((acc, task) => {
    let currentGroup = acc[task.status] ? [...acc[task.status]] : [];
    currentGroup = [...currentGroup, task]
    return { ...acc, [task.status]: currentGroup };
    }, initialStatusGroups);
    return (
        <> 

    <h2 className="text-5xl font-black my-10">Tareas</h2>

    <div className='flex gap-5 overflow-x-scroll 2xl:overflow-auto pb-32'>
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            {Object.entries(groupedTasks).map(([status, tasks]) => (
                <div key={status} className='min-w-75 2xl:min-w-0 2xl:w-1/5'>
                    <h3 className={`capitalize text-xl font-light border border-slate-300 bg-white p-3 border-t-8 ${statusStyles[status]}`}>{StatusTranslations[status]}</h3>
                    <DropTask status={status} />
                    <ul className='mt-5 space-y-5'>
                        {tasks.length === 0 ? (
                            <li className="text-gray-500 text-center pt-3">No hay tareas</li>
                        ) : (
                            tasks.map(task => <TaskCard key={task._id} task={task}
                            canEdit={canEdit} />)
                        )}
                    </ul>
                </div>
            ))}
        </DndContext>
            </div>
        </>
    )
}
