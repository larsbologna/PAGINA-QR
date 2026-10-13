/**
 * Textos legales editables. Revisalos con un profesional antes de usarlos
 * comercialmente: son una base razonable, no asesoramiento legal.
 * {producto}, {proveedor} y {email} se reemplazan con las variables de entorno.
 */
export const PRIVACY_SECTIONS: { title: string; body: string }[] = [
  {
    title: "Qué datos recogemos de quienes dejan una opinión",
    body: "La puntuación (1 a 5), el comentario que decidas escribir y las categorías que selecciones. No necesitás crear una cuenta. Solo si marcás \"Quiero que me contacten\", guardamos el nombre, teléfono y/o email que ingreses, para que el negocio pueda responderte; sin esa marca no se guarda ningún dato de contacto. Te pedimos que no incluyas datos personales en el comentario.",
  },
  {
    title: "Datos técnicos",
    body: "Para prevenir abusos registramos un identificador derivado de la conexión (un hash irreversible, no la dirección IP) durante un período breve, y la fecha y hora del envío.",
  },
  {
    title: "Para qué se usan",
    body: "Las opiniones y los datos de contacto opcionales son privados: solo los ve el negocio que los recibió y {proveedor}, que presta el servicio. Se usan para mejorar la atención y, si lo pediste, para contactarte. Nunca se publican automáticamente en Google ni en otro sitio.",
  },
  {
    title: "Reseñas en Google",
    body: "Ofrecemos a todas las personas, sin importar su puntuación, un enlace opcional al perfil público del negocio en Google. Si decidís dejar una reseña allí, la escribís y la publicás vos, y queda sujeta a las políticas de Google.",
  },
  {
    title: "Conservación y eliminación",
    body: "Cada negocio define un plazo de conservación (por defecto, 24 meses). Pasado ese plazo, las opiniones se eliminan. Podés solicitar la eliminación de una opinión escribiendo a {email}, indicando el negocio, la fecha y la hora aproximada.",
  },
  {
    title: "Derechos",
    body: "Podés ejercer los derechos de acceso, rectificación y supresión previstos en la Ley 25.326 de Protección de Datos Personales. La Agencia de Acceso a la Información Pública es el órgano de control.",
  },
];

export const TERMS_SECTIONS: { title: string; body: string }[] = [
  {
    title: "El servicio",
    body: "{producto} es una herramienta provista por {proveedor} para que los negocios reciban opiniones privadas de sus clientes mediante un código QR, las organicen en un panel y faciliten el acceso a su perfil público de Google.",
  },
  {
    title: "Lo que el servicio no hace",
    body: "No publica reseñas en nombre de nadie, no filtra quién puede dejar una reseña pública, no ofrece incentivos por puntuación y no garantiza posiciones ni resultados en Google ni en ningún buscador.",
  },
  {
    title: "Uso correcto",
    body: "Los negocios se comprometen a no ofrecer beneficios a cambio de reseñas, no pedir a los clientes que cambien su puntuación y no publicar las opiniones privadas sin consentimiento. Deben respetar las políticas de contenido de Google.",
  },
  {
    title: "Opiniones",
    body: "Las personas que opinan se comprometen a no incluir datos personales de terceros, insultos ni contenido ilegal. El negocio puede agregar notas internas, pero no puede modificar la puntuación ni el comentario recibidos.",
  },
  {
    title: "Contacto",
    body: "Para consultas sobre estos términos escribí a {email}.",
  },
];
