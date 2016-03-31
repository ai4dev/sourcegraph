import React from "react";
import update from "react/lib/update";
import URL from "url";
import Fuze from "fuse.js";
import classNames from "classnames";
import Container from "sourcegraph/Container";
import Dispatcher from "sourcegraph/Dispatcher";
import debounce from "lodash/function/debounce";
import * as router from "sourcegraph/util/router";
import TreeStore from "sourcegraph/tree/TreeStore";
import DefStore from "sourcegraph/def/DefStore";
import "sourcegraph/tree/TreeBackend";
import "sourcegraph/def/DefBackend";
import * as TreeActions from "sourcegraph/tree/TreeActions";
import * as DefActions from "sourcegraph/def/DefActions";
import {qualifiedNameAndType} from "sourcegraph/def/Formatter";

import Modal from "sourcegraph/components/Modal";

import TreeStyles from "./styles/Tree.css";
import BaseStyles from "sourcegraph/components/styles/base.css";

const SYMBOL_LIMIT = 5;
const FILE_LIMIT = 15;

class TreeSearch extends Container {
	constructor(props) {
		super(props);
		this.state = {
			visible: !props.overlay,
			focused: !props.overlay,
			matchingDefs: {Defs: []},
			allFiles: [],
			matchingFiles: [],
			fileResults: [], // either the full directory tree (for empty query) or matching file paths
			query: "",
			selectionIndex: 0,
		};
		this._handleKeyDown = this._handleKeyDown.bind(this);
		this._focusInput = this._focusInput.bind(this);
		this._blurInput = this._blurInput.bind(this);
		this._dismissModal = this._dismissModal.bind(this);
		this._getSelectionURL = this._getSelectionURL.bind(this);
		this._debouncedSetQuery = debounce((query) => {
			const matchingFiles = (query && this.state.fuzzyFinder) ?
				this.state.fuzzyFinder.search(query).map(i => this.state.allFiles[i]) :
				this.state.allFiles;
			this.setState({query: query, matchingFiles: matchingFiles, selectionIndex: 0});
		}, 75, {leading: false, trailing: true});
	}

	componentDidMount() {
		super.componentDidMount();
		if (global.document) {
			document.addEventListener("keydown", this._handleKeyDown);
		}

		if (global.window) {
			window.addEventListener("focus", () => {
				if (this.state.visible) this._focusInput();
			});
		}
	}

	componentWillUnmount() {
		super.componentWillUnmount();
		if (global.document) {
			document.removeEventListener("keydown", this._handleKeyDown);
		}
		if (global.window) {
			window.removeEventListener("focus");
		}
	}

	stores() { return [TreeStore, DefStore]; }

	reconcileState(state, props) {
		let navigatedDirectory = false;
		if (state.currPath !== props.currPath) {
			// Directory navigation should reset selectionIndex to the first result.
			navigatedDirectory = true;
		}
		state.navigatedDirectory = navigatedDirectory;

		Object.assign(state, props);

		const setFileList = () => {
			if (state.query === "") {
				// Show entire file tree as file results.
				if (state.fileTree) {
					let dirLevel = state.fileTree;
					for (const part of state.currPath) {
						if (dirLevel.Dirs[part]) {
							dirLevel = dirLevel.Dirs[part];
						} else {
							break;
						}
					}
					const dirs = Object.keys(dirLevel.Dirs).map(dir => ({
						name: dir,
						isDirectory: true,
						url: router.tree(this.props.repo, this.props.rev,
							`${state.currPath.join("/")}${state.currPath.length > 0 ? "/" : ""}${dir}`),
					}));

					state.fileResults = dirs.concat(dirLevel.Files.map(file => ({
						name: file,
						isDirectory: false,
						url: router.tree(this.props.repo, this.props.rev,
							`${state.currPath.join("/")}${state.currPath.length > 0 ? "/" : ""}${file}`),
					})));
				}

			} else if (state.matchingFiles) {
				state.fileResults = state.matchingFiles.map(file => ({
					name: file,
					isDirectory: false,
					url: router.tree(this.props.repo, this.props.rev, file),
				}));
			}
		};

		state.fileTree = TreeStore.fileTree.get(state.repo, state.rev, state.commitID);

		let sourceFileList = TreeStore.fileLists.get(state.repo, state.rev, state.commitID);
		sourceFileList = sourceFileList ? sourceFileList.Files : null;
		if (state.allFiles !== sourceFileList) {
			state.allFiles = sourceFileList;
			if (sourceFileList) {
				state.fuzzyFinder = state.allFiles && new Fuze(state.allFiles, {
					distance: 1000,
					location: 0,
					threshold: 0.1,
				});
			}
			setFileList();
		}

		state.srclibDataVersion = TreeStore.srclibDataVersions.get(state.repo, state.rev, state.commitID);
		state.matchingDefs = state.srclibDataVersion && state.srclibDataVersion.CommitID ? DefStore.defs.list(state.repo, state.srclibDataVersion.CommitID, state.query) : null;

		if (state.processedQuery !== state.query) {
			// Recompute file list when query changes.
			state.processedQuery = state.query;
			setFileList();
		}
		if (navigatedDirectory) {
			setFileList();
		}
	}

	onStateTransition(prevState, nextState) {
		const becameVisible = nextState.visible && nextState.visible !== prevState.visible;
		const prefetch = nextState.prefetch && nextState.prefetch !== prevState.prefetch;
		if (becameVisible || prefetch || nextState.repo !== prevState.repo || nextState.rev !== prevState.rev || nextState.commitID !== prevState.commitID) {
			Dispatcher.Backends.dispatch(new TreeActions.WantSrclibDataVersion(nextState.repo, nextState.rev, nextState.commitID));
			Dispatcher.Backends.dispatch(new TreeActions.WantFileList(nextState.repo, nextState.rev, nextState.commitID));
		}
		if (nextState.srclibDataVersion !== prevState.srclibDataVersion) {
			if (nextState.srclibDataVersion && nextState.srclibDataVersion.CommitID) {
				Dispatcher.Backends.dispatch(
					new DefActions.WantDefs(nextState.repo, nextState.srclibDataVersion.CommitID, nextState.query)
				);
			}
		}

		if (nextState.query !== prevState.query) {
			if (nextState.srclibDataVersion && nextState.srclibDataVersion.CommitID) {
				Dispatcher.Backends.dispatch(
					new DefActions.WantDefs(nextState.repo, nextState.srclibDataVersion.CommitID, nextState.query)
				);
			}
		}
	}

	_handleKeyDown(e) {
		const tag = e.target.tagName;

		if (this.state.overlay) {
			switch (e.keyCode) {
			case 84: // "t"
				if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
				this._focusInput();
				e.preventDefault();
				break;

			case 27: // ESC
				this._dismissModal();
			}
		}

		let idx, max, part;
		switch (e.keyCode) {
		case 40: // ArrowDown
			idx = this._normalizedSelectionIndex();
			max = this._numResults();

			this.setState({
				selectionIndex: idx + 1 >= max ? 0 : idx + 1,
			});

			e.preventDefault(); // TODO: make keyboard actions scroll automatically with selection
			break;

		case 38: // ArrowUp
			idx = this._normalizedSelectionIndex();
			max = this._numResults();

			this.setState({
				selectionIndex: idx < 1 ? max-1 : idx-1,
			});

			e.preventDefault(); // TODO: make keyboard actions scroll automatically with selection
			break;

		case 37: // ArrowLeft
			if (this.state.currPath.length !== 0) {
				Dispatcher.Stores.dispatch(new TreeActions.UpDirectory());
			}

			// Allow default (cursor movement in <input>)
			break;

		case 39: // ArrowRight
			part = this._getSelectedPathPart();
			if (part) {
				Dispatcher.Stores.dispatch(new TreeActions.DownDirectory(part));
			}

			// Allow default (cursor movement in <input>)
			break;

		case 13: // Enter
			part = this._getSelectedPathPart();
			if (part) {
				Dispatcher.Stores.dispatch(new TreeActions.DownDirectory(part));
			} else {
				window.location = this._getSelectionURL();
			}
			e.preventDefault();
			break;

		default:
			if (this.state.focused) {
				setTimeout(() => this._debouncedSetQuery(this.refs.input ? this.refs.input.value : ""), 0);
			}
			break;
		}
	}

	_focusInput() {
		if (global.document && document.body.dataset.fileSearchDisabled) {
			return null;
		}

		this.setState({
			visible: true,
			focused: true,
		}, () => this.refs.input && this.refs.input.focus());
	}

	_blurInput() {
		if (this.refs.input) this.refs.input.blur();
		this.setState({
			focused: false,
		});
	}

	_dismissModal() {
		if (this.state.overlay) {
			this.setState({
				visible: false,
			});
		}
	}

	_numSymbolResults() {
		if (!this.state.matchingDefs || !this.state.matchingDefs.Defs) return 0;
		return this.state.matchingDefs.Defs.length > SYMBOL_LIMIT ? SYMBOL_LIMIT : this.state.matchingDefs.Defs.length;
	}

	_numFileResults() {
		let numFileResults = this.state.fileResults.length > FILE_LIMIT ? FILE_LIMIT : this.state.fileResults.length;
		// Override file results to show full directory tree on empty query, or when
		// query is 3+ chars.
		if (this.state.query === "" || this.state.query.length >= 3) numFileResults = this.state.fileResults.length;
		return numFileResults;
	}

	_numResults() {
		return this._numFileResults() + this._numSymbolResults();
	}

	_normalizedSelectionIndex() {
		const numResults = this._numResults();
		if (this.state.navigatedDirectory) {
			return Math.min(this.state.selectionIndex, this._numSymbolResults(), numResults - 1);
		}
		return Math.min(this.state.selectionIndex, numResults - 1);
	}

	_getSelectionURL() {
		const i = this._normalizedSelectionIndex();
		if (i < this._numSymbolResults()) {
			const def = this.state.matchingDefs.Defs[i];
			return router.def(def.Repo, def.CommitID, def.UnitType, def.Unit, def.Path);
		}
		return this.state.fileResults[i - this._numSymbolResults()].url;
	}

	// returns the selected directory name, or null
	_getSelectedPathPart() {
		const i = this._normalizedSelectionIndex();
		if (i < this._numSymbolResults()) {
			return null;
		}

		const result = this.state.fileResults[i - this._numSymbolResults()];
		if (result.isDirectory) return result.name;
		return null;
	}

	// returns the selected file name, or null
	_getSelectedFile() {
		const i = this._normalizedSelectionIndex();
		if (i < this._numSymbolResults()) {
			return null;
		}

		const result = this.state.fileResults[i - this._numSymbolResults()];
		if (!result.isDirectory) return result.name;
		return null;
	}

	_listItems() {
		const items = this.state.fileResults;
		const emptyItem = <div className={TreeStyles.list_item} key="_nofiles"><i>No matches.</i></div>;
		if (!items || items.length === 0) return [emptyItem];

		let list = [],
			limit = items.length > FILE_LIMIT ? FILE_LIMIT : items.length;

		// Override limit if query is empty to show the full directory tree.
		if (this.state.query === "") limit = items.length;
		const onClick = (item) => {
			if (item.isDirectory) return () => Dispatcher.Stores.dispatch(new TreeActions.DownDirectory(item.name));
			if (global.window) {
				return () => window.location.href = item.url;
			}
			return null;
		};

		for (let i = 0; i < limit; i++) {
			let item = items[i],
				itemURL = item.url;

			const selected = this._normalizedSelectionIndex() - this._numSymbolResults() === i;

			list.push(
				<div className={selected ? TreeStyles.list_item_selected : TreeStyles.list_item}
					onMouseOver={() => this._selectItem(i + this._numSymbolResults())}
					onClick={onClick(item)}
					key={itemURL}>
					<span className={TreeStyles.filetype_icon}><i className={classNames("fa", {
						"fa-file-text-o": !item.isDirectory,
						"fa-folder": item.isDirectory,
					})}></i>
					</span>
					{false && <a className={TreeStyles.link} href={itemURL}>{item.name}</a>}
					{<span>{item.name}</span>}
				</div>
			);
		}

		return list;
	}

	_selectItem(i) {
		this.setState({
			selectionIndex: i,
		});
	}

	_symbolItems() {
		const loadingItem = <div className={TreeStyles.list_item} key="_loadingsymbol"><i>Loading...</i></div>;
		if (!this.state.matchingDefs) return [loadingItem];

		const emptyItem = <div className={TreeStyles.list_item} key="_nosymbol"><i>No matches.</i></div>;
		if (this.state.matchingDefs && (!this.state.matchingDefs.Defs || this.state.matchingDefs.Defs.length === 0)) return [emptyItem];

		let list = [],
			limit = this.state.matchingDefs.Defs.length > SYMBOL_LIMIT ? SYMBOL_LIMIT : this.state.matchingDefs.Defs.length;

		const onClick = (url) => {
			if (global.window) {
				return () => window.location.href = url;
			}
			return null;
		};

		for (let i = 0; i < limit; i++) {
			let def = this.state.matchingDefs.Defs[i];
			let defURL = router.def(def.Repo, def.CommitID, def.UnitType, def.Unit, def.Path);

			const selected = this._normalizedSelectionIndex() === i;

			list.push(
				<div className={selected ? TreeStyles.list_item_selected : TreeStyles.list_item}
					onMouseOver={() => this._selectItem(i)}
					onClick={onClick(defURL)}
					key={defURL}>
					<div key={defURL}>
						<code>{qualifiedNameAndType(def)}</code>
					</div>
				</div>
			);
		}

		return list;
	}

	_buildsURL() {
		if (global.location && global.location.href) {
			let url = URL.parse(global.location.href);
			url.pathname = `${this.state.repo}/.builds`;
			return URL.format(url);
		}

		return "";
	}

	_wrapModalContainer(elem) {
		if (this.state.overlay) return <Modal shown={this.state.visible} onDismiss={this._dismissModal}>{elem}</Modal>;
		return elem;
	}

	render() {

		const pathNav = (i) => () => Dispatcher.Stores.dispatch(new TreeActions.GoToDirectory(
			update(this.state.currPath, {$splice: [[i + 1, this.state.currPath.length - 1 - i]]})
		));
		const path = (<div className={TreeStyles.file_path}>
			<span className={TreeStyles.repo_part}
				onClick={() => Dispatcher.Stores.dispatch(new TreeActions.GoToDirectory([]))}>thesrc</span>
			<span className={TreeStyles.path_sep}
				onClick={() => Dispatcher.Stores.dispatch(new TreeActions.GoToDirectory([]))}>/</span>
			{this.state.currPath.map((part, i) => <span key={i}>
				<span className={TreeStyles.path_part} onClick={pathNav(i)}>{part}</span>
				<span className={TreeStyles.path_sep} onClick={pathNav(i)}>/</span>
				</span>)}
			{this._getSelectedPathPart() &&
				<span className={TreeStyles.path_selected}>
				<span className={TreeStyles.path_part}>{this._getSelectedPathPart()}</span>
				<span className={TreeStyles.path_sep}>/</span></span>}
			{this._getSelectedFile() &&
				<span className={TreeStyles.path_selected}>
				<span className={TreeStyles.path_part}>{this._getSelectedFile()}</span></span>}
		</div>);

		return (
			<div className={this.state.visible ? TreeStyles.tree_container : BaseStyles.hidden}>
				{this._wrapModalContainer(<div className={this.state.overlay ? TreeStyles.tree_modal : TreeStyles.tree}>
					<div className={TreeStyles.input_container}>
						<input className={TreeStyles.input}
							type="text"
							onFocus={this._focusInput}
							onBlur={this._blurInput}
							autoFocus={true}
							placeholder="Jump to symbols or files..."
							ref="input" />
					</div>
					<div className={TreeStyles.list_header}>
						Symbols
					</div>
					<div>
						{this.state.srclibDataVersion && this.state.srclibDataVersion.CommitID && this._symbolItems()}
						{this.state.srclibDataVersion && !this.state.srclibDataVersion.CommitID &&
							<div className={TreeStyles.list_item}>
								<span className={TreeStyles.icon}><i className="fa fa-spinner fa-spin"></i></span>
								<i>Sourcegraph is analyzing your code &mdash;&nbsp;
									<a className={TreeStyles.link} href={this._buildsURL()}>results will be available soon!</a>
								</i>
							</div>
						}
					</div>
					<div className={TreeStyles.list_header}>
						Files
						{this.state.query === "" && path}
					</div>
					<div className={TreeStyles.list_item_group}>
						{this._listItems()}
					</div>
				</div>)}
			</div>
		);
	}
}

TreeSearch.propTypes = {
	repo: React.PropTypes.string.isRequired,
	rev: React.PropTypes.string.isRequired,
	commitID: React.PropTypes.string.isRequired,
	currPath: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
	overlay: React.PropTypes.bool.isRequired,
	prefetch: React.PropTypes.bool,
};

export default TreeSearch;
