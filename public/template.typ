#set page(
  paper: "a4",
  margin: (x: 1.5cm, y: 1.5cm),
  numbering: (page, total) => [Page #page sur #total],
)
#set par(justify: true)
#set text(font: ("Arial", "Noto Sans Symbols"), size: 11pt)
#show block: set block(breakable: false)
#let data = json("/data.json")
// #let data = json("/data.json.dummy")

#let isFinal = data.evaluationType == "Finale"

#grid(
  columns: (auto, 1fr),
  gutter: 1cm,
  align(horizon)[#image("/assets/logo.png", width: 4cm)],
  align(right + horizon, text(
    14pt,
    weight: "bold",
  )[Travail de maturité #if isFinal [ \ RAPPORT FINAL D'ÉVALUATION ] else [ – Évaluation intermédiaire ]]),
)

#v(1cm)

#let parts = data.date.split("-")
#let formatted_date = parts.at(2) + "." + parts.at(1) + "." + parts.at(0)

#if isFinal [
  *Date :* #formatted_date  #h(1fr) *Note obtenue :* #text(size: 25pt)[#box(stroke: 1pt)[#align(center + horizon)[#square()[#data.at("note", default: "4.5")]]]]
] else [
  *Date :* #formatted_date #h(1fr)
  #if data.evaluationType == "Première" { text(font: "Noto Sans Symbols")[#sym.ballot.cross] } else { sym.ballot } Première / #if data.evaluationType == "Seconde" { text(font: "Noto Sans Symbols")[#sym.ballot.cross] } else { sym.ballot } Seconde évaluation intermédiaire
]

#v(0.5cm)
*Auteur·trice / Coauteur·trice·s*
#v(0.2cm)

#for auteur in data.auteurs [
  #grid(
    columns: (auto, 1fr, auto, 1fr, auto, 1fr),
    gutter: 10pt,
    [Prénom :], auteur.prenom, [Nom :], auteur.nom, [Classe :], auteur.classe,
  )
  #v(0.2cm)
]

#if not isFinal [
  #v(0.3cm)
  *Thème :* #data.at("theme", default: "") #h(1fr) *Répondant·e :* #data.at("repondant", default: "")
]

#v(0.5cm)
*Titre :* #data.titre

#line(length: 100%, stroke: 2pt)

#if not isFinal [
  = Travail effectué, résultats obtenus jusqu'ici
  #v(0.2cm)
  #block(width: 100%, stroke: 0.5pt, inset: 10pt)[
    #if data.travail == "" [ #v(3cm) ] else [ #data.travail ]
  ]
  #v(0.5cm)
  = Évaluation du travail
  #v(0.2cm)
]

#let item(num, texte) = {
  let message = if isFinal { strong[#num. #texte] } else { [- #texte] }
  block(sticky: true)[#message]
}

#item("1", "Recherches et méthodes de travail")
#block(width: 100%, stroke: 0.5pt, inset: 10pt)[
  #if data.recherches == "" [ #v(2cm) ] else [ #data.recherches ]
]

#item("2", "Contenu et sens")
#block(width: 100%, stroke: 0.5pt, inset: 10pt)[
  #if data.contenu == "" [ #v(2cm) ] else [ #data.contenu ]
]

#item("3", "Structure de l'opuscule")
#block(width: 100%, stroke: 0.5pt, inset: 10pt)[
  #if data.structure == "" [ #v(2cm) ] else [ #data.structure ]
]

#item("4", "Expression")
#block(width: 100%, stroke: 0.5pt, inset: 10pt)[
  #if data.at("expression", default: "") == "" [ #v(2cm) ] else [ #data.expression ]
]

#item("5", "Présentation")
#block(width: 100%, stroke: 0.5pt, inset: 10pt)[
  #if data.at("presentation", default: "") == "" [ #v(2cm) ] else [ #data.presentation ]
]

#item("6", "Sens critique, lucidité sur son travail")
#block(width: 100%, stroke: 0.5pt, inset: 10pt)[
  #if data.at("sensCritique", default: "") == "" [ #v(2cm) ] else [ #data.sensCritique ]
]

#if not isFinal [
  #pagebreak(weak: true)
  = Consignes, demandes du répondant pour la suite du travail
  #block(width: 100%, stroke: 0.5pt, inset: 10pt)[
    #if data.at("consignes", default: "") == "" [ #v(3cm) ] else [ #data.consignes ]
  ]
]

= Remarques
#block(width: 100%, stroke: 0.5pt, inset: 10pt)[
  #if data.at("remarques", default: "") == "" [ #v(2cm) ] else [ #data.remarques ]
]


#if not isFinal [
  #v(2cm)
  #grid(
    stroke: .0pt,
    columns: 4,
    column-gutter: 5pt,
    align: bottom,
    [Date : ], [#formatted_date], [#h(1fr) Signature du ou de la répondante :], [#line(length: 4cm)],
  )
  #v(2cm)
  #grid(
    stroke: .0pt,
    columns: 2,
    column-gutter: 1fr,
    row-gutter: 2cm,
    align: bottom,
    ..data.auteurs.map(u => ([Prénom et nom de l'élève : ] + u.prenom + [ ] + u.nom,)).flatten(),
    ..data.auteurs.map(u => [Signature : #box[#line(length: 4cm)]]).flatten()
  )
] else [
  #v(2cm)
  Date : #formatted_date
  #grid(
    stroke: .0pt,
    columns: 2,
    column-gutter: 1fr,
    row-gutter: (.5cm, 2cm),
    align: left,
    [Le ou la répondante], [L'expert·e],
    [Nom : #data.at("repondant", default: "")], [Nom : #data.at("expert", default: "")],
    [Signature : #box[#line(length: 4cm)]], [Signature : #box[#line(length: 4cm)]],
  )

  #v(1fr)
  #align(center)[_Une copie de ce rapport doit être adressée à l'élève et au doyen responsable._]
]
