/* eslint-disable no-undef */
let imgSrc;
describe("Pruebas e2e del juego", () => {
  beforeEach(() => {
    cy.visit("http://localhost:8080");
  });

  describe("Validación de ventana inicial", () => {
    describe("Verifica que la pagina de inicio cargue correctamente", () => {
      it("La ventana de inicio cuenta con el título de la aplicación", () => {
        cy.get("h2").should(
          "contain",
          "¿Eres el mejor maestro pokemon del mundo?"
        );
      });
      it("La ventana de inicio cuenta con las instrucciones", () => {
        cy.get("h3").should(
          "contain",
          "Memoriza la mayor cantidad de Pokemons y demuestralo!!"
        );
      });
      it("La ventana de inicio cuenta el texto que presenta al equyipo de la ronda", () => {
        cy.get("h1").should("contain", "Equipo elegido para esta ronda:");
      });
      it("La ventana de inicio cuenta con el contenedor de los botones que muestran los Pokemons y, a su vez, tiene el tamaño correcto de Pokemones dados, siendo 6", () => {
        cy.wait(2000);

        cy.get(".button-container").should("exist");
        cy.get(".button-container .image-button").should("have.length", "6");
      });
      it("La ventana de inicio cuenta con el botón para iniciar la partida", () => {
        cy.get(".start-button").should("exist");
      });
    });
  });

  describe("Secuencia Inicial", () => {
    it("La ventana de inicio cuenta con el botón para iniciar la partida y al hacer click en el, se inicia la partida", () => {
      cy.intercept("POST", "/enviarSecuencia").as("iniciarJuego");

      cy.get(".start-button").click();

      cy.wait("@iniciarJuego").its("response.statusCode").should("eq", 200);

      cy.contains("h1", "Secuencia a memorizar:").should("exist");

      cy.get("div")
        .contains("Secuencia a memorizar:")
        .parent()
        .find("img")
        .should("have.length.greaterThan", 0);
    });

    it("Después de 5 segundos, la secuencia cambiará las imagenes por Ditto para que recuerde cuantos Pokemones había", () => {
      cy.intercept("POST", "/enviarSecuencia").as("iniciarJuego");

      cy.get(".start-button").click();

      cy.wait("@iniciarJuego").its("response.statusCode").should("eq", 200);

      cy.contains("h1", "Secuencia a memorizar:").should("exist");

      cy.wait(5500);
      cy.contains("h1", "Secuencia a memorizar:")
        .parent()
        .find("img")
        .each(($img) => {
          cy.wrap($img).should(
            "have.attr",
            "src",
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/132.png"
          );
        });
    });
  });

  describe(" Creación y envío de secuencia ", () => {
    it("Validar que al dar click en un Pokemon este sea añadido a la secuencia", () => {
      let imgBtn;
      cy.intercept("POST", "/enviarSecuencia").as("iniciarJuego");
      cy.get(".start-button").click();
      cy.wait("@iniciarJuego").its("response.statusCode").should("eq", 200);
      cy.contains("h1", "Secuencia a memorizar:").should("exist");
      cy.wait(5500);

      cy.get(".button-container .image-button")
        .first()
        .find("img")
        .invoke("attr", "src")
        .then((src) => {
          imgBtn = src;

          cy.get(".button-container .image-button").first().click();

          cy.contains("h1", "Secuencia a enviar:")
            .parent()
            .find("img")
            .should("have.attr", "src", imgBtn);
        });
    });
    it("La prueba debe de validar que al dar click en un Pokemon de la secuencia este sea removido", () => {
      cy.intercept("POST", "/enviarSecuencia").as("iniciarJuego");

      cy.get(".start-button").click();

      cy.wait("@iniciarJuego").its("response.statusCode").should("eq", 200);

      cy.contains("h1", "Secuencia a memorizar:").should("exist");

      cy.wait(5500);
      cy.get(".button-container .image-button").first().click();

      cy.contains("h1", "Secuencia a enviar:")
        .parent()
        .find("img")
        .should("have.length", 1);

      cy.contains("h1", "Secuencia a enviar:").parent().find("img").click();

      cy.contains("h1", "Secuencia a enviar:")
        .parent()
        .find("img")
        .should("have.length", 0);
    });
    it("Mostrar el botón de enviar secuencia cuando la secuencia esté completa", () => {
      cy.intercept("POST", "/enviarSecuencia").as("iniciarJuego");

      cy.get(".start-button").click();

      cy.wait("@iniciarJuego").its("response.statusCode").should("eq", 200);
      cy.wait(5500);

      cy.contains("h1", "Secuencia a memorizar:")
        .parent()
        .find("img")
        .each(($img) => {
          cy.get(".button-container .image-button").eq($img.index()).click();
        });

      cy.get(".play-button").should("exist");
    });
    it("Validar que la secuencia sea enviada como parámetro en la petición POST que se llama al dar click en 'Enviar Secuencia'", () => {
      cy.intercept("POST", "/enviarSecuencia").as("iniciarJuego");

      cy.get(".start-button").click();

      cy.wait("@iniciarJuego").its("response.statusCode").should("eq", 200);

      cy.wait(5500);
      cy.intercept("POST", "/enviarSecuencia").as("envioSecuencia");
      cy.contains("h1", "Secuencia a memorizar:")
        .parent()
        .find("img")
        .each(($img) => {
          cy.get(".button-container .image-button").eq($img.index()).click();
        });

      cy.get(".play-button").should("exist");
      cy.get(".play-button").click();
      cy.wait("@envioSecuencia").then((interception) => {
        expect(interception.request.body).to.have.property("idJuego");
        expect(interception.request.body).to.have.property("pokemons");
        expect(interception.request.body.pokemons).to.be.an("array");
        expect(interception.request.body.pokemons.length).to.be.greaterThan(0);
      });
    });
  });
  describe("Finalización del Juego", () => {
    it("Debe mostrar el puntaje cuando el juego termina tras un error", function () {
      cy.intercept("POST", "/enviarSecuencia").as("iniciarJuego");

      cy.get(".start-button").click();

      cy.wait("@iniciarJuego").its("response.statusCode").should("eq", 200);

      cy.get("#secuenciaAMemorizar1 img").each(($img) => {
        imgSrc = $img.attr("src");
      });
      cy.wait(5500);
      cy.get("#secuenciaAMemorizar1 img").should("have.length.greaterThan", 0);
      cy.get(".button-container .image-button").each(($btn) => {
        const btnSrc = $btn.find("img").attr("src");
        if (imgSrc !== btnSrc) {
          cy.wrap($btn).click();
        }
      });

      cy.get(".play-button").should("exist").click();

      cy.contains("h1", "GAME OVER").should("exist");
      cy.contains("h2", "Puntaje:").should("exist");
    });
  });
});
