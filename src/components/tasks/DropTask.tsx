import { useDndContext, useDroppable } from "@dnd-kit/core"

type DropTaskProps = {
    status: string
}

export default function DropTask({status}: DropTaskProps) {
    const {active} = useDndContext()
    const {isOver, setNodeRef} = useDroppable({
        id: status
    })

    // el hook se llama siempre; el recuadro solo se renderiza mientras se arrastra una tarea
    if(!active) return null

    const style = {
        opacity: isOver ? 0.4 : undefined
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="text-xs font-semibold uppercase p-2 border border-dashed border-slate-500 mt-5 grid place-content-center text-slate-500"
        >
            Soltar tarea aquí
        </div>
    )
}
