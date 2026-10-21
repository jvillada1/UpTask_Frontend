import { Link, useNavigate } from "react-router-dom"
import Logo from "@/components/Logo"

export default function NotFound() {
    const navigate = useNavigate()

    return (
        <div className="bg-gray-800 min-h-screen">
            <div className="py-10 lg:py-20 mx-auto max-w-2xl px-5 text-center">
                <Logo />

                <p className="mt-16 text-9xl font-black text-fuchsia-500">404</p>
                <h1 className="mt-4 text-4xl font-black text-white">Página no encontrada</h1>
                <p className="mt-5 text-xl font-light text-gray-300">
                    La página que buscas no existe, fue eliminada o no tienes acceso a ella.
                </p>

                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/"
                        className="bg-fuchsia-600 hover:bg-fuchsia-700 px-10 py-3 text-white text-xl font-bold transition-colors"
                    >
                        Ir a Mis Proyectos
                    </Link>
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="border border-gray-500 hover:border-white px-10 py-3 text-gray-300 hover:text-white text-xl font-bold cursor-pointer transition-colors"
                    >
                        Volver atrás
                    </button>
                </div>
            </div>
        </div>
    )
}
