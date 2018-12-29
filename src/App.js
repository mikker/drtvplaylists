import React, { Component } from "react";
import { findDOMNode } from "react-dom";
import cn from "classnames";
import "@mikker/btn";
import "tachyons";

const testUrls = [
  "https://www.dr.dk/tv/se/joergensens-jul-en-vejrvaerts-bekendelser/joergensens-jul-en-vejrvaerts-bekendelser-2/joergensens-jul-en-vejrvaerts-bekendelser-1-2",
  "https://www.dr.dk/tv/se/joergensens-jul-en-vejrvaerts-bekendelser/joergensens-jul-en-vejrvaerts-bekendelser-2/joergensens-jul-en-vejrvaerts-bekendelser-2-2"
];

class App extends Component {
  state = {
    cards: {},
    activeCardUrn: null
  };

  componentDidMount() {
    this.videoElm = findDOMNode(this.refs.player);

    setTimeout(() => {
      this.fetchCard(extractSlugFromUrl(testUrls[0]));
    }, 500);
    // setTimeout(() => {
    //   this.fetchCard(extractSlugFromUrl(testUrls[1]));
    // }, 1500);

    // gonzo style integration testing
  }

  addURL = () => {
    const url = window.prompt("Paste url");
    if (!url) return;

    const slug = extractSlugFromUrl(url);
    this.fetchCard(slug);
  };

  fetchCard = slug => {
    fetch(`/api/expanded?slug=${slug}`, {
      headers: { "Content-Type": "application/json" }
    })
      .then(resp => resp.json())
      .then(data => {
        const card = data.Data[0];
        if (!card) return;

        this.setState(state => ({
          cards: {
            ...state.cards,
            [card.Urn]: card
          },
          activeCardUrn: state.activeCardUrn || card.Urn
        }));
      });
  };

  pickCard = activeCardUrn => {
    this.setState({ activeCardUrn });
  };

  handleEnded = event => {
    // ok, so we know we reached the end of the activeCardUrn card
    // we need to switch to the next one
    // let's do it in another next() function so we can test easier
    this.nextVideo();
  };

  nextVideo = () => {
    this.jump(1); // -1 for prev
  };

  prevVideo = () => {
    this.jump(-1);
  };

  jump = steps => {
    const { cards, activeCardUrn } = this.state;

    const keys = Object.keys(cards);
    const index = keys.indexOf(activeCardUrn);

    const flip = steps > 0 ? 0 : (keys.length - 1)
    const destExists = !!keys[index + steps];

    const destination = destExists ? (index + steps) : flip;

    this.setState({ activeCardUrn: keys[destination] });
  };

  render() {
    const { cards, activeCardUrn } = this.state;
    const activeCard = cards[activeCardUrn];
    const videoUrl = lookupVideo(activeCard);

    const done = () => {
      // if (this.videoElm.paused) this.videoElm.play();
    };

    // This is so bad, doing this inside render. But here we are ...
    if (activeCardUrn) {
      if (window.Hls.isSupported()) {
        var hls = new window.Hls();
        hls.loadSource(videoUrl);
        hls.attachMedia(this.videoElm);
        hls.on(window.Hls.Events.MANIFEST_PARSED, done);
      } else if (this.videoElm.canPlayType("application/vnd.apple.mpegurl")) {
        this.videoElm.src = videoUrl;
        this.videoElm.addEventListener("loadedmetadata", done);
      }
    }

    return (
      <div className="vh-100 sans-serif flex bg-near-black near-white f6">
        <div className="w-80 flex-none flex items-center">
          <video
            ref="player"
            controls
            className="w-100"
            onEnded={this.handleEnded}
            autoPlay
          />
        </div>
        <Sidebar
          cards={cards}
          activeCardUrn={activeCardUrn}
          pickCard={this.pickCard}
          addURL={this.addURL}
          className="w-20 flex-none"
          nextVideo={this.nextVideo}
          prevVideo={this.prevVideo}
        />
      </div>
    );
  }
}

function Sidebar({
  cards,
  activeCardUrn,
  addURL,
  pickCard,
  className,
  prevVideo,
  nextVideo
}) {
  return (
    <div className="pa2 overflow-y-scroll">
      <ul className={cn("w-100 list ma0 pa0", className)}>
        {Object.keys(cards).map(key => {
          const card = cards[key];
          const image = lookupImage(card);

          return (
            <li key={key} className="mb2 lh-title">
              <button
                className={cn(
                  "flex flex-column link ba bw1 b--white-10 white bg-white-10 pa2 br3",
                  {
                    "b--blue": activeCardUrn === key
                  }
                )}
                onClick={e => {
                  e.preventDefault();
                  pickCard(card.Urn);
                }}
              >
                <div>
                  <img
                    src={image ? image.Uri : "https://placehold.it/200x100"}
                    alt="Still"
                    className="mb1"
                  />
                </div>
                {card.Title}
              </button>
            </li>
          );
        })}
      </ul>
      <button className="btn bg-blue white w-100" onClick={addURL}>
        Add show
      </button>
      <div className="flex">
        <button className="btn bg-blue white w-100" onClick={prevVideo}>
          &lt;&lt;
        </button>
        <button className="btn bg-blue white w-100" onClick={prevVideo}>
          &gt;&gt;
        </button>
      </div>
    </div>
  );
}

function lookupImage(card) {
  if (!card) return;

  return card.Assets.filter(asset => asset.Kind === "Image")[0];
}

function lookupVideo(card) {
  if (!card) return;

  const assets = card.Assets;
  const video = assets.filter(asset => {
    return asset.Kind === "VideoResource";
  })[0];
  const hls = video.Links.filter(link => {
    return link.Target === "HLS";
  })[0];

  return hls.Uri;
}

function extractSlugFromUrl(url) {
  // Handle URLs ending with a slash by removing the slash if it exists
  if (url.substring(url.length - 1) === "/") {
    url = url.substring(0, url.length - 1);
  }
  const parts = url.split("/");
  const last = parts[parts.length - 1];
  return last.replace(/#.*$/, "");
}

export default App;
